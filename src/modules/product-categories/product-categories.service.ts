import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductCategory } from './product-category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectModel(ProductCategory.name)
    private categoryModel: Model<ProductCategory>
  ) {}

  async create(categorydata: CreateCategoryDto): Promise<ProductCategory> {
    try {
      if (categorydata.parentId) {
        const parent = await this.categoryModel.findById(categorydata.parentId);

        if (!parent || parent.deletedAt)
          throw new NotFoundException(`Parent Category with ID "${categorydata.parentId}" not found`);
      }

      const slug = categorydata.name.toLowerCase().replace(/ /g, '-');
      const category = new this.categoryModel({ ...categorydata, slug });
      category.populate({
        path: 'categoryId',
        select: 'name slug'
      });
      return await category.save();
    } catch (error) {
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException(`Category with name or slug already exists`);
      }
      throw error;
    }
  }

  async update(id: string, categorydata: UpdateCategoryDto): Promise<ProductCategory> {
    const category = await this.categoryModel.findById(id);

    if (!category || category.deletedAt) {
      throw new NotFoundException(`Category with ID "${id}" not found or has been deleted`);
    }

    if (categorydata.parentId && categorydata.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const updateData: any = { ...categorydata };
    if (categorydata.name) {
      updateData.slug = categorydata.name.toLowerCase().replace(/ /g, '-');
    }

    return this.categoryModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  async softDelete(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel.findById(id);

    if (!category || category.deletedAt) {
      throw new NotFoundException(`Category with ID "${id}" not found or has been deleted`);
    }

    const hasChildren = await this.categoryModel.findOne({ parentIdId: id, deletedAt: null });
    if (hasChildren) {
      throw new BadRequestException('Cannot delete Category that has sub-categories');
    }

    if (category.isUsed) {
      category.isActive = false;
      return await category.save();
    }

    category.deletedAt = new Date();
    category.isActive = false;
    return await category.save();
  }

  async findByid(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel
      .findById(id)
      .populate({
        path: 'categoryId',
        select: 'name slug'
      })
      .lean()
      .exec();
    if (!category || category.deletedAt) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  async findAll(): Promise<ProductCategory[]> {
    return this.categoryModel
      .find({ deletedAt: null, isActive: true })
      .populate({
        path: 'categoryId',
        select: 'name slug'
      })
      .lean()
      .exec();
  }

  async getLookup() {
    return this.categoryModel.find({ deletedAt: null, isActive: true }, { name: 1, id: 1, parentId: 1 }).lean().exec();
  }

  async getTree() {
    const all = await this.categoryModel.find({ deletedAt: null, isActive: true }).lean().exec();

    const buildTree = (parentId: string | null = null): any[] => {
      return all
        .filter((category) => {
          const parent = category.parentId ? category.parentId.toString() : null;
          return parent === parentId;
        })
        .map((category) => ({
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          parentId: category.parentId ? category.parentId.toString() : null,
          isActive: category.isActive,
          isUsed: category.isUsed,
          deletedAt: category.deletedAt,
          children: buildTree(category.id.toString())
        }));
    };

    return buildTree(null);
  }
}
