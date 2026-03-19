import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { TrackingType } from '@common/enums/tracking-type.enum';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  /** Reusable population fields for consistency */
  private readonly defaultPopulate = [
    { path: 'categoryId', select: 'name slug' },
    { path: 'parentId', select: 'name sku trackingType' }
  ];

  /** Create a new product or variant template */
  async create(productData: CreateProductDto): Promise<Product> {
    try {
      const data = { ...productData };
      if (data.trackingType === TrackingType.VARIANT && !data.parentId) {
        data.isVariantParent = true;
      } else if (data.parentId) {
        data.isVariantParent = false;
      }

      const product = new this.productModel(data);
      const saved = await product.save();

      const populated = await saved.populate(this.defaultPopulate);
      return populated.toObject() as any as Product;
    } catch (error) {
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException(`Product with SKU "${productData.sku}" already exists`);
      }
      throw new InternalServerErrorException('Something went wrong during product creation');
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
      this.productModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(this.defaultPopulate)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter).exec()
    ]);

    return {
      data: data as any as Product[],
      total,
      page,
      lastPage: Math.ceil(total / limit)
    };
  }

  /** Find single product by ID with full details */
  async findById(id: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ _id: id, deletedAt: null })
      .populate(this.defaultPopulate)
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product as any as Product;
  }

  /** Update product details with ERP Immutability rules */
  async update(id: string, productData: UpdateProductDto): Promise<Product> {
    const product = await this.productModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!product) throw new NotFoundException(`Product with ID "${id}" not found`);

    if (product.isUsed) {
      const isSkuChanged = productData.sku && productData.sku !== product.sku;
      const isTrackingChanged = productData.trackingType && productData.trackingType !== product.trackingType;

      if (isSkuChanged || isTrackingChanged) {
        throw new BadRequestException('Cannot change SKU or tracking type of a used product');
      }
    }

    const updated = await this.productModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: productData },
        { returnDocument: 'after', runValidators: true, lean: true }
      )
      .populate(this.defaultPopulate)
      .exec();

    return updated as any as Product;
  }

  /** Toggle product active status using Atomic Pipeline */
  async toggleStatus(id: string): Promise<Product> {
    const product = await this.productModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      })
      .exec();

    if (!product) throw new NotFoundException(`Product with ID "${id}" not found`);
    return product as any as Product;
  }

  /** Soft delete with variant cascading */
  async softDelete(id: string): Promise<Product> {
    const product = await this.productModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!product) throw new NotFoundException(`Product with ID "${id}" not found`);

    // Cascade to variants if it's a template
    if (product.isVariantParent) {
      await this.productModel
        .updateMany(
          { parentId: id, deletedAt: null },
          { $set: { isActive: false, deletedAt: product.isUsed ? null : new Date() } }
        )
        .exec();
    }

    const updatePayload = product.isUsed ? { isActive: false } : { isActive: false, deletedAt: new Date() };

    const result = await this.productModel
      .findOneAndUpdate({ _id: id }, { $set: updatePayload }, { returnDocument: 'after', lean: true })
      .exec();

    return result as any as Product;
  }

  /** Bulk update status for multiple products */
  async bulkToggleStatus(ids: string[], isActive: boolean) {
    return this.productModel.updateMany({ _id: { $in: ids }, deletedAt: null }, { $set: { isActive } }).exec();
  }

  /** Product statistics for dashboard */
  async getDashboardStats() {
    const [total, active, templates, lowStock] = await Promise.all([
      this.productModel.countDocuments({ deletedAt: null }).exec(),
      this.productModel.countDocuments({ deletedAt: null, isActive: true }).exec(),
      this.productModel.countDocuments({ deletedAt: null, isVariantParent: true }).exec(),
      this.productModel.countDocuments({ deletedAt: null, $expr: { $lte: ['$minStockLevel', 5] } }).exec()
    ]);

    return { total, active, templates, lowStock };
  }

  /** Create variant with strict parent matching */
  async createVariant(parentId: string, variantData: CreateProductDto): Promise<Product> {
    const parent = await this.productModel
      .findOne({ _id: parentId, isVariantParent: true, deletedAt: null })
      .lean()
      .exec();

    if (!parent) {
      throw new BadRequestException(`Valid Parent Template with ID "${parentId}" not found`);
    }

    if (variantData.trackingType !== parent.trackingType) {
      throw new BadRequestException(`Variant must match Parent tracking type: ${parent.trackingType}`);
    }

    variantData.parentId = parentId;
    return this.create(variantData);
  }

  /** Lightweight lookup for dropdowns */
  async getParentLookup(): Promise<Product[]> {
    return this.productModel
      .find({ isVariantParent: true, deletedAt: null, isActive: true }, 'name sku')
      .lean()
      .exec() as any;
  }
}
