import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { TrackingType } from '@common/enums/tracking-type.enum';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  /** Fields to populate in product queries */
  private readonly defaultPopulate = [
    { path: 'categoryId', select: 'name slug' },
    { path: 'parentId', select: 'name sku trackingType' }
  ];

  /** Create a new product or variant template */
  async create(productData: CreateProductDto): Promise<Product> {
    try {
      if (productData.trackingType === TrackingType.VARIANT && !productData.parentId) {
        productData.isVariantParent = true;
      } else if (productData.parentId) {
        productData.isVariantParent = false;
      }

      const product = new this.productModel(productData);
      await product.populate(this.defaultPopulate);
      return await product.save();
    } catch (error) {
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException(`Product with SKU "${productData.sku}" already exists`);
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  /** Get paginated, filtered, and searchable product list */
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    isVariantParent?: boolean;
  }) {
    const { page = 1, limit = 20, search, categoryId, isActive, isVariantParent = false } = params;
    const skip = (page - 1) * limit;

    const filter: any = { deletedAt: null, isVariantParent };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId);
    if (isActive !== undefined) filter.isActive = isActive;

    const [data, total] = await Promise.all([
      this.productModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(this.defaultPopulate),
      this.productModel.countDocuments(filter)
    ]);

    return {
      data,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    };
  }

  /** Find single product by ID with full details */
  async findById(id: string): Promise<Product> {
    const product = await this.productModel.findOne({ _id: id, deletedAt: null }).populate(this.defaultPopulate);

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID "${id}" not found or has been deleted`);
    }
    return product;
  }

  /** Toggle product active/inactive status */
  async update(id: string, productData: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (product.isUsed) {
      if (productData.trackingType && productData.trackingType !== product.trackingType) {
        throw new BadRequestException(
          `Cannot change tracking type for Product ID "${id}" because it is already used in transactions`
        );
      }
      if (productData.sku && productData.sku !== product.sku) {
        throw new BadRequestException(
          `Cannot change SKU for Product ID "${id}" because it is already used in transactions`
        );
      }
    }

    return this.productModel.findByIdAndUpdate(
      id,
      { $set: productData },
      { returnDocument: 'after', runValidators: true }
    );
  }

  /** Toggle product active/inactive status */
  async toggleStatus(id: string): Promise<Product> {
    const product = await this.productModel.findOne({ _id: id, deletedAt: null });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found or has been deleted`);
    }

    product.isActive = !product.isActive;
    await product.save();

    return product;
  }

  /** Soft delete product or deactivate if used in transactions */
  async softDelete(id: string): Promise<Product> {
    const product = await this.productModel.findById(id);
    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID "${id}" not found or has been deleted`);
    }

    if (product.isVariantParent) {
      await this.productModel.updateMany(
        { parentId: id },
        { $set: { isActive: false, deletedAt: product.isUsed ? null : new Date() } }
      );
    }

    if (product.isUsed) {
      product.isActive = false;
      return product.save();
    }

    product.deletedAt = new Date();
    product.isActive = false;
    return product.save();
  }

  /** Bulk update active status for multiple products */
  async bulkToggleStatus(ids: string[], isActive: boolean) {
    return this.productModel.updateMany({ id: { $in: ids }, deletedAt: null }, { $set: { isActive } });
  }

  /** Aggregate product statistics for admin dashboard */
  async getDashboardStats() {
    const [total, active, templates, lowStock] = await Promise.all([
      this.productModel.countDocuments({ deletedAt: null }),
      this.productModel.countDocuments({ deletedAt: null, isActive: true }),
      this.productModel.countDocuments({ deletedAt: null, isVariantParent: true }),
      this.productModel.countDocuments({ deletedAt: null, $expr: { $lte: ['$minStockLevel', 5] } })
    ]);

    return { total, active, templates, lowStock };
  }

  /** Create a variant linked to a validated parent template */
  async createVariant(parentId: string, variantData: CreateProductDto): Promise<Product> {
    const parent = await this.productModel.findById(parentId);
    if (!parent || !parent.isVariantParent) {
      throw new BadRequestException(`Invalid or missing Parent Product "${parentId}"`);
    }

    if (variantData.trackingType !== parent.trackingType) {
      throw new BadRequestException(`Variant must match Parent tracking type: ${parent.trackingType}`);
    }

    variantData.parentId = parentId;
    return this.create(variantData);
  }

  /** Get lightweight parent list for selection dropdowns */
  async getParentLookup(): Promise<Product[]> {
    return this.productModel.find(
      {
        isVariantParent: true,
        deletedAt: null,
        isActive: true
      },
      { name: 1, sku: 1, id: 1 }
    );
  }
}
