import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './products.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { TrackingType } from '@common/enums/tracking-type.enum';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  async create(productData: CreateProductDto): Promise<Product> {
    try {
      if (productData.trackingType === TrackingType.VARIANT) {
        productData.isVariantParent = true;
      }

      const product = new this.productModel(productData);
      return await product.save();
    } catch (error) {
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException(`Product with SKU "${productData.sku}" already exists`);
      }
      throw error;
    }
  }

  async update(productId: string, productdata: UpdateProductDto): Promise<Product> {
    const product = await this.productModel.findById(productId);

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID "${productId}" not found or has been deleted`);
    }

    if (product.isUsed) {
      if (productdata.trackingType && productdata.trackingType !== product.trackingType) {
        throw new BadRequestException(
          `Cannot change tracking type for Product ID "${productId}" because it is already used in transactions`
        );
      }
      if (productdata.sku && productdata.sku !== product.sku) {
        throw new BadRequestException(
          `Cannot change SKU for Product ID "${productId}" because it is already used in transactions`
        );
      }
    }

    return this.productModel.findByIdAndUpdate(productId, { $set: productdata }, { new: true, runValidators: true });
  }

  async softDelete(productId: string): Promise<Product> {
    const product = await this.productModel.findById(productId);

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID "${productId}" not found or has been deleted`);
    }

    if (product.isUsed) {
      product.isActive = false;
      return product.save();
    }

    product.deletedAt = new Date();
    product.isActive = false;
    return product.save();
  }

  async findById(productId: string): Promise<Product> {
    const product = await this.productModel
      .findById(productId)
      .populate([
        {
          path: 'parentId',
          select: 'name'
        },
        {
          path: 'categoryId',
          select: 'name'
        }
      ])
      .lean()
      .exec();

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
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
          path: 'parentId',
          select: 'name'
        },
        {
          path: 'categoryId',
          select: 'name'
        }
      ])
      .lean()
      .exec();
  }

  async createVariant(parentId: string, variantProductData: CreateProductDto): Promise<Product> {
    const parent = await this.productModel.findById(parentId);

    if (!parent) {
      throw new NotFoundException(`Parent Product with ID "${parentId}" not found`);
    }

    if (!parent.isVariantParent) {
      throw new BadRequestException(`Product with ID "${parentId}" is not a valid Variant Parent`);
    }

    variantProductData.parentId = parentId;

    return this.create(variantProductData);
  }
}
