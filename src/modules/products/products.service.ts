import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { TrackingType } from '@common/enums/tracking-type.enum';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  async create(productData: CreateProductDto): Promise<Product> {
    try {
      if (productData.trackingType === TrackingType.VARIANT && !productData.parentId) {
        productData.isVariantParent = true;
      } else if (productData.parentId) {
        productData.isVariantParent = false;
      }

      const product = new this.productModel(productData);
      await product.populate([
        {
          path: 'categoryId',
          select: 'name slug'
        },
        {
          path: 'parentId',
          select: 'name sku trackingType'
        }
      ]);
      return await product.save();
    } catch (error) {
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException(`Product with SKU "${productData.sku}" already exists`);
      }
      throw error;
    }
  }

  async update(id: string, productdata: UpdateProductDto): Promise<Product> {
    const product = await this.productModel.findById(id);

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID "${id}" not found or has been deleted`);
    }

    if (product.isUsed) {
      if (productdata.trackingType && productdata.trackingType !== product.trackingType) {
        throw new BadRequestException(
          `Cannot change tracking type for Product ID "${id}" because it is already used in transactions`
        );
      }
      if (productdata.sku && productdata.sku !== product.sku) {
        throw new BadRequestException(
          `Cannot change SKU for Product ID "${id}" because it is already used in transactions`
        );
      }
    }

    return this.productModel.findByIdAndUpdate(id, { $set: productdata }, { new: true, runValidators: true });
  }

  async softDelete(id: string): Promise<Product> {
    const product = await this.productModel.findById(id);

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID "${id}" not found or has been deleted`);
    }

    if (product.isUsed) {
      product.isActive = false;
      return product.save();
    }

    product.deletedAt = new Date();
    product.isActive = false;
    return product.save();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate([
        {
          path: 'categoryId',
          select: 'name slug'
        },
        {
          path: 'parentId',
          select: 'name sku trackingType'
        }
      ])
      .lean()
      .exec();

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async findAllActive(): Promise<Product[]> {
    return this.productModel
      .find({
        deletedAt: null,
        isActive: true,
        isVariantParent: false
      })
      .populate([
        {
          path: 'categoryId',
          select: 'name slug'
        },
        {
          path: 'parentId',
          select: 'name sku trackingType'
        }
      ])
      .lean()
      .exec();
  }

  async getParentLookup(): Promise<Product[]> {
    return this.productModel
      .find(
        {
          isVariantParent: true,
          deletedAt: null,
          isActive: true
        },
        { name: 1, sku: 1, _id: 1 }
      )
      .lean()
      .exec();
  }

  async createVariant(parentId: string, variantData: CreateProductDto): Promise<Product> {
    const parent = await this.productModel.findById(parentId);

    if (!parent) {
      throw new NotFoundException(`Parent Product with ID "${parentId}" not found`);
    }

    if (!parent.isVariantParent) {
      throw new BadRequestException(`Product with ID "${parentId}" is not a valid Variant Parent`);
    }

    if (variantData.trackingType !== parent.trackingType) {
      throw new BadRequestException(
        `Variant tracking type (${variantData.trackingType}) must match Parent tracking type (${parent.trackingType})`
      );
    }

    if (variantData.trackingType === TrackingType.VARIANT) {
      throw new BadRequestException(
        'A variant product cannot be a Variant Parent itself. Hierarchy is limited to 2 levels.'
      );
    }

    variantData.parentId = parentId;

    return this.create(variantData);
  }
}
