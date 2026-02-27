import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductCategory } from './product-categories.schema';
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
      const slug = categorydata.name.toLowerCase().replace(/ /g, '-');
      const category = new this.categoryModel({ ...categorydata, slug });
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
    if (!category) throw new NotFoundException(`Category "${id}" not found`);

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
    if (!category) throw new NotFoundException(`Category "${id}" not found`);

    const hasChildren = await this.categoryModel.findOne({ parentId: id, deletedAt: null });
    if (hasChildren) {
      throw new BadRequestException('Cannot delete category that has sub-categories');
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
        path: 'parentId',
        select: 'name'
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
        path: 'parentId',
        select: 'name'
      })
      .lean()
      .exec();
  }

  async getTree() {
    const all = await this.categoryModel.find({ deletedAt: null, isActive: true }).lean().exec();

    const buildTree = (parentId: string | null = null): any[] => {
      return all
        .filter((item) => {
          const pid = item.parentId ? item.parentId.toString() : null;
          return pid === parentId;
        })
        .map((item) => ({
          ...item,
          id: item._id.toString(),
          children: buildTree(item._id.toString())
        }));
    };

    return buildTree(null);
  }
}
