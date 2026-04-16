import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { ProductPrice, ProductPriceDocument } from './product-price.schema';
import { Product, ProductDocument } from '@modules/products/product.schema';
import { Currency, CurrencyDocument } from '@modules/currencies/schemas/currency.schema';
import { CreateProductPriceDto } from './dto/create-price.dto';
import { UpdateProductPriceDto } from './dto/update-price.dto';
import { CurrentPriceDto } from './dto/current-price.dto';
import { PriceType } from '@common/enums/price-type.enum';

@Injectable()
export class ProductPricesService {
  constructor(
    @InjectModel(ProductPrice.name) private priceModel: Model<ProductPriceDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Currency.name) private currencyModel: Model<CurrencyDocument>,
    @InjectConnection() private readonly connection: Connection
  ) {}

  /** Get active price for a product based on date and type */
  async getCurrentPrice(params: CurrentPriceDto): Promise<ProductPrice> {
    const { productId, type } = params;
    const now = new Date();
    const price = await this.priceModel
      .findOne({
        productId,
        priceType: type,
        isActive: true,
        startDate: { $lte: now },
        $or: [{ endDate: null }, { endDate: { $gt: now } }]
      })
      .sort({ startDate: -1 })
      .lean()
      .exec();

    if (!price) throw new NotFoundException('Active product price not found');
    return price as any as ProductPrice;
  }

  /** Find all prices for a product, sorted by newest first */
  async getPriceHistory(productId: string): Promise<ProductPrice[]> {
    const data = await this.priceModel.find({ productId }).sort({ startDate: -1 }).lean().exec();

    return data as any as ProductPrice[];
  }

  /** Get detailed product price information by ID */
  async findById(id: string): Promise<ProductPrice> {
    const price = await this.priceModel.findOne({ _id: id }).lean().exec();
    if (!price) throw new NotFoundException(`Product price with ID "${id}" not found`);
    return price as any as ProductPrice;
  }

  /**
   * Create a new price record and sync it to the Product snapshot.
   * This ensures history is kept and search/sort remains fast.
   */
  async create(createPriceDto: CreateProductPriceDto): Promise<ProductPrice> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const { productId, priceType, amount, currencyId, startDate = new Date() } = createPriceDto;

      // 1. ARCHIVE: Close current active price of this specific type
      await this.priceModel.updateMany(
        { productId, priceType, isActive: true },
        { $set: { isActive: false, endDate: startDate } },
        { session }
      );

      // 2. CREATE: Register the new historical price record
      const [price] = await this.priceModel.create([createPriceDto], { session });

      await this.currencyModel.updateOne({ _id: createPriceDto.currencyId }, { $set: { isUsed: true } }, { session });

      // 3. SYNC: Update the Product Card (Snapshot fields)
      // Determine which field to update on the main Product document
      const updatePayload: any = { currencyId };

      if (priceType === PriceType.RETAIL) {
        updatePayload.salePriceDefault = amount;
      } else if (priceType === PriceType.PURCHASE) {
        updatePayload.purchasePriceDefault = amount;
      }

      // Only update the product snapshot if the price is effective immediately
      if (new Date(startDate) <= new Date()) {
        const updatedProduct = await this.productModel.findOneAndUpdate(
          { _id: productId, deletedAt: null },
          { $set: updatePayload },
          { session, new: true }
        );

        if (!updatedProduct) {
          throw new BadRequestException(`Product with ID "${productId}" not found`);
        }
      }

      await session.commitTransaction();

      return price.toObject() as any as ProductPrice;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /** Update product price details by ID */
  async update(id: string, UpdatePriceDto: UpdateProductPriceDto): Promise<ProductPrice> {
    const price = await this.priceModel
      .findOneAndUpdate({ _id: id }, { $set: UpdatePriceDto }, { returnDocument: 'after', lean: true })
      .exec();

    if (!price) throw new NotFoundException(`Product price with ID "${id}" not found`);
    return price as any as ProductPrice;
  }
}
