import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { PurchaseReceipt } from './purchase-receipt.schema';
import { Product } from '../products/products.schema';
import { StockBalance } from '../inventory/stock-balance.schema';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';
import { PurchaseReceiptStatus } from '@common/enums/receipt-status.enum';
import { TrackingType } from '@common/enums/tracking-type.enum';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class PurchaseReceiptService {
  constructor(
    @InjectModel(PurchaseReceipt.name) private receiptModel: Model<PurchaseReceipt>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(StockBalance.name) private stockModel: Model<StockBalance>,
    private readonly connection: Connection,
  ) {}

  /**
   * Create a receipt in DRAFT status. No stock or product 'isUsed' impact yet.
   */
  async create(receiptData: CreatePurchaseReceiptDto): Promise<PurchaseReceipt> {
    const receipt = new this.receiptModel(receiptData);
    return await receipt.save();
  }

  async findOne(receiptId: string): Promise<PurchaseReceipt> {
    const receipt = await this.receiptModel
      .findById(receiptId)
      .populate('supplierId', 'name')      // Supplierning faqat nomini olamiz
      .populate('warehouseId', 'name')     // Ombordan faqat nomini olamiz
      .populate('lines.productId', 'name sku trackingType'); // Mahsulot detallari bilan

    if (!receipt) {
      throw new NotFoundException(`Purchase Receipt with ID "${receiptId}" not found`);
    }

    return receipt;
  }

  /**
   * Confirms the receipt: Validates tracking rules, increases stock, and locks the document.
   */
  async confirm(receiptId: string): Promise<PurchaseReceipt> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const receipt = await this.receiptModel.findById(receiptId).session(session);
      if (!receipt) throw new NotFoundException(`Purchase Receipt "${receiptId}" not found`);

      if (receipt.status !== PurchaseReceiptStatus.DRAFT) {
        throw new BadRequestException(`Receipt "${receiptId}" is already ${receipt.status}`);
      }

      for (const line of receipt.lines) {
        const product = await this.productModel.findById(line.productId).session(session);
        if (!product || product.deletedAt) throw new NotFoundException(`Product "${line.productId}" not found`);

        // Rule: Variant parent cannot be purchased
        if (product.isVariantParent) {
          throw new BadRequestException(`Product "${product.name}" is a Variant Parent. Only specific variants can be purchased.`);
        }

        // 1. Validate line based on tracking type
        this.validateTracking(product, line);

        // 2. Mark product as used (prevents SKU/Tracking changes)
        await this.productModel.findByIdAndUpdate(line.productId, { isUsed: true }).session(session);

        // 3. Increase Inventory
        if (product.trackingType === TrackingType.SERIALIZED) {
          await this.processSerialized(receipt.warehouseId.toString(), line, session);
        } else {
          await this.processBulk(receipt.warehouseId.toString(), line, session);
        }
      }

      receipt.status = PurchaseReceiptStatus.CONFIRMED;
      const confirmedReceipt = await receipt.save({ session });

      await session.commitTransaction();
      return confirmedReceipt;
    } catch (error) {
      await session.abortTransaction();
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException(`Duplicate Serial Number detected in your receipt.`);
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cancels a confirmed receipt and reverts stock impact.
   */
  async cancel(receiptId: string, reason: string): Promise<PurchaseReceipt> {
    if (!reason) throw new BadRequestException(`Cancellation reason is required for Receipt "${receiptId}"`);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const receipt = await this.receiptModel.findById(receiptId).session(session);
      if (!receipt || receipt.status !== PurchaseReceiptStatus.CONFIRMED) {
        throw new BadRequestException(`Only CONFIRMED receipts can be cancelled. Status is: ${receipt?.status}`);
      }

      for (const line of receipt.lines) {
        if (line.serialNumbers?.length) {
          // Revert Serialized
          await this.stockModel.deleteMany({
            serialNumber: { $in: line.serialNumbers },
            warehouseId: receipt.warehouseId
          }).session(session);
        } else {
          // Revert Bulk
          const stock = await this.stockModel.findOne({
            productId: line.productId,
            warehouseId: receipt.warehouseId,
            lotCode: line.lotCode || null,
            expirationDate: line.expirationDate || null
          }).session(session);

          if (!stock || stock.quantity < line.quantity) {
            throw new BadRequestException(`Cannot cancel: Insufficient stock for Product ID "${line.productId}".`);
          }
          stock.quantity -= line.quantity;
          await stock.save({ session });
        }
      }

      receipt.status = PurchaseReceiptStatus.CANCELLED;
      receipt.cancellationReason = reason;
      const cancelledReceipt = await receipt.save({ session });

      await session.commitTransaction();
      return cancelledReceipt;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --- Private Helpers ---

  private validateTracking(product: any, line: any) {
    if (product.trackingType === TrackingType.EXPIRABLE && !line.expirationDate) {
      throw new BadRequestException(`Expiration date required for expirable product "${product.name}"`);
    }
    if (product.trackingType === TrackingType.LOT_TRACKED && !line.lotCode) {
      throw new BadRequestException(`Lot code required for lot-tracked product "${product.name}"`);
    }
    if (product.trackingType === TrackingType.SERIALIZED) {
      if (!line.serialNumbers || line.serialNumbers.length !== line.quantity) {
        throw new BadRequestException(`Serial numbers count must match quantity (${line.quantity}) for "${product.name}"`);
      }
    }
  }

  private async processSerialized(warehouseId: string, line: any, session: any) {
    const serials = line.serialNumbers.map((sn: string) => ({
      productId: line.productId,
      warehouseId: warehouseId,
      quantity: 1,
      serialNumber: sn
    }));
    await this.stockModel.insertMany(serials, { session });
  }

  private async processBulk(warehouseId: string, line: any, session: any) {
    await this.stockModel.findOneAndUpdate(
      {
        productId: line.productId,
        warehouseId: warehouseId,
        lotCode: line.lotCode || null,
        expirationDate: line.expirationDate || null
      },
      { $inc: { quantity: line.quantity } },
      { upsert: true, session }
    );
  }
}