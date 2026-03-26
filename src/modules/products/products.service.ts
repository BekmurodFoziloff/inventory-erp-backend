import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Product, ProductDocument } from './product.schema';
import { ProductCategory, ProductCategoryDocument } from '@modules/product-categories/product-category.schema';
import { Brand, BrandDocument } from '@modules/brands/brand.schema';
import { UnitOfMeasure, UomDocument } from '@modules/units-of-measure/unit-of-measure.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { TrackingType } from '@common/enums/tracking-type.enum';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductCategory.name) private categoryModel: Model<ProductCategoryDocument>,
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(UnitOfMeasure.name) private uomModel: Model<UomDocument>,
    @InjectConnection() private readonly connection: Connection
  ) {}

  private readonly defaultPopulate = [
    { path: 'categoryId', select: 'name slug' },
    { path: 'parentId', select: 'name sku trackingType' },
    { path: 'brandId', select: 'name' },
    { path: 'uomId', select: 'name' }
  ];

  /** Get product dashboard statistics */
  async getDashboardStats() {
    const [total, active, templates, lowStock] = await Promise.all([
      this.productModel.countDocuments({ deletedAt: null }).exec(),
      this.productModel.countDocuments({ deletedAt: null, isActive: true }).exec(),
      this.productModel.countDocuments({ deletedAt: null, isVariantParent: true }).exec(),
      this.productModel.countDocuments({ deletedAt: null, $expr: { $lte: ['$minStockLevel', 5] } }).exec()
    ]);
    return { total, active, templates, lowStock };
  }

  /** Get lightweight parent product list for selection dropdowns */
  async getParentLookup(): Promise<Product[]> {
    return this.productModel
      .find({ isVariantParent: true, deletedAt: null, isActive: true }, 'name sku')
      .lean()
      .exec() as any;
  }

  /** Get paginated, filtered, and searchable product list */
  async findAll(params: FindAllProductsDto) {
    const { page = 1, limit = 20, search, categoryId, brandId, isActive, isVariantParent = false } = params;
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
    if (brandId) filter.brandId = new Types.ObjectId(brandId);
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

    return { data: data as any as Product[], total, page, lastPage: Math.ceil(total / limit) };
  }

  /** Get detailed product information by ID */
  async findById(id: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ _id: id, deletedAt: null })
      .populate(this.defaultPopulate)
      .lean()
      .exec();

    if (!product) throw new NotFoundException(`Product with ID "${id}" not found`);
    return product as any as Product;
  }

  /** Create a new product or variant template */
  async create(productData: CreateProductDto): Promise<Product> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const data = { ...productData };
      if (data.trackingType === TrackingType.VARIANT && !data.parentId) {
        data.isVariantParent = true;
      } else if (data.parentId) {
        data.isVariantParent = false;
      }

      const [product] = await this.productModel.create([data], { session });

      await this.categoryModel.updateOne({ _id: productData.categoryId }, { $set: { isUsed: true } }, { session });
      await this.brandModel.updateOne({ _id: productData.brandId }, { $set: { isUsed: true } }, { session });
      await this.uomModel.updateOne({ _id: productData.uomId }, { $set: { isUsed: true } }, { session });

      await session.commitTransaction();

      const populated = await product.populate(this.defaultPopulate);
      return populated.toObject() as any as Product;
    } catch (error) {
      await session.abortTransaction();

      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException('Product SKU already exists');
      }
      throw new InternalServerErrorException('Error creating product');
    } finally {
      session.endSession();
    }
  }

  /** Update product details by ID */
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

  /** Quickly toggle product active status */
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

  /** Soft delete product by ID */
  async softDelete(id: string): Promise<Product> {
    const product = await this.productModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!product) throw new NotFoundException(`Product with ID "${id}" not found`);

    if (product.isVariantParent) {
      await this.productModel
        .updateMany(
          { parentId: id, deletedAt: null },
          { $set: { isActive: false, deletedAt: product.isUsed ? null : new Date() } }
        )
        .exec();
    }

    const updatePayload = product.isUsed ? { isActive: false } : { isActive: false, deletedAt: new Date() };
    const deleted = await this.productModel
      .findOneAndUpdate({ _id: id }, { $set: updatePayload }, { returnDocument: 'after', lean: true })
      .exec();

    return deleted as any as Product;
  }

  /** Mass update product active status */
  async bulkToggleStatus(ids: string[], isActive: boolean) {
    return this.productModel.updateMany({ _id: { $in: ids }, deletedAt: null }, { $set: { isActive } }).exec();
  }

  /** Create a product variant linked to a parent template */
  async createVariant(parentId: string, variantData: CreateProductDto): Promise<Product> {
    const parent = await this.productModel
      .findOne({ _id: parentId, isVariantParent: true, deletedAt: null })
      .lean()
      .exec();
    if (!parent) throw new BadRequestException(`Valid Parent Template "${parentId}" not found`);

    if (variantData.trackingType !== parent.trackingType) {
      throw new BadRequestException(`Variant must match Parent tracking type: ${parent.trackingType}`);
    }

    variantData.parentId = parentId;
    return this.create(variantData);
  }
}
