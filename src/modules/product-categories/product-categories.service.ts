import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductCategory, ProductCategoryDocument } from './product-category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectModel(ProductCategory.name)
    private categoryModel: Model<ProductCategoryDocument>
  ) {}

  /** Reuseable population for consistency */
  private readonly defaultPopulate = { path: 'parentId', select: 'name slug' };

  /** Create new category with parent validation */
  async create(categoryData: CreateCategoryDto): Promise<ProductCategory> {
    try {
      if (categoryData.parentId) {
        const parent = await this.categoryModel.findOne({ _id: categoryData.parentId, deletedAt: null }).lean().exec();
        if (!parent) {
          throw new NotFoundException(`Parent Category "${categoryData.parentId}" not found`);
        }
      }

      const slug = categoryData.name.toLowerCase().trim().replace(/\s+/g, '-');
      const category = new this.categoryModel({ ...categoryData, slug });

      const saved = await category.save();
      const populated = await saved.populate(this.defaultPopulate);
      return populated.toObject() as any as ProductCategory;
    } catch (error) {
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException('Category name or slug already exists');
      }
      throw error instanceof NotFoundException ? error : new InternalServerErrorException('Error creating category');
    }
  }

  /** Advanced list for Admin with search and status filters */
  async findAll(params: { search?: string; isActive?: boolean }): Promise<ProductCategory[]> {
    const filter: any = { deletedAt: null };
    if (params.search) filter.name = { $regex: params.search, $options: 'i' };
    if (params.isActive !== undefined) filter.isActive = params.isActive;

    const data = await this.categoryModel.find(filter).populate(this.defaultPopulate).sort({ name: 1 }).lean().exec();

    return data as any as ProductCategory[];
  }

  /** Find by ID with populated parent - Read optimized */
  async findById(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel
      .findOne({ _id: id, deletedAt: null })
      .populate(this.defaultPopulate)
      .lean()
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category as any as ProductCategory;
  }

  /** Update category with circular reference check */
  async update(id: string, categoryData: UpdateCategoryDto): Promise<ProductCategory> {
    const category = await this.categoryModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!category) throw new NotFoundException(`Category "${id}" not found`);

    if (categoryData.parentId && categoryData.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const updateBody: any = { ...categoryData };
    if (categoryData.name) {
      updateBody.slug = categoryData.name.toLowerCase().trim().replace(/\s+/g, '-');
    }

    const updated = await this.categoryModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: updateBody },
        { returnDocument: 'after', runValidators: true, lean: true }
      )
      .populate(this.defaultPopulate)
      .exec();

    return updated as any as ProductCategory;
  }

  /** Quick toggle for isActive status - Atomic Approach */
  async toggleStatus(id: string): Promise<ProductCategory> {
    const updated = await this.categoryModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      })
      .exec();

    if (!updated) throw new NotFoundException(`Category "${id}" not found`);
    return updated as any as ProductCategory;
  }

  /** Soft delete with dependency checks */
  async softDelete(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!category) throw new NotFoundException(`Category "${id}" not found`);

    // 1. Check for sub-categories (Corrected field name to 'parentId')
    const hasChildren = await this.categoryModel.findOne({ parentId: id, deletedAt: null }).lean().exec();
    if (hasChildren) {
      throw new BadRequestException('Cannot delete Category that has active sub-categories');
    }

    // 2. Logic: If used by products, just deactivate. Otherwise, soft-delete.
    const updatePayload = category.isUsed ? { isActive: false } : { isActive: false, deletedAt: new Date() };

    const result = await this.categoryModel
      .findOneAndUpdate({ _id: id }, { $set: updatePayload }, { returnDocument: 'after', lean: true })
      .exec();

    return result as any as ProductCategory;
  }

  /** Get lightweight list for dropdowns */
  async getLookup(): Promise<ProductCategory[]> {
    const data = await this.categoryModel.find({ deletedAt: null, isActive: true }, 'name parentId').lean().exec();
    return data as any as ProductCategory[];
  }

  /** Get Breadcrumbs: e.g. "Electronics > Phones > Smartphones" */
  async getAncestors(id: string): Promise<ProductCategory[]> {
    const ancestors: any[] = [];
    let currentId = id;

    while (currentId) {
      const category = await this.categoryModel.findById(currentId, 'name parentId').lean().exec();
      if (!category) break;
      ancestors.unshift(category);
      currentId = category.parentId ? category.parentId.toString() : null;
    }
    return ancestors as any as ProductCategory[];
  }

  /** Get hierarchical tree structure - O(n) algorithm */
  async getTree(): Promise<any[]> {
    const categories = await this.categoryModel.find({ deletedAt: null, isActive: true }).lean().exec();

    const map: Record<string, any> = {};
    const tree: any[] = [];

    categories.forEach((cat) => {
      const id = cat._id.toString();
      map[id] = { ...cat, id, children: [] };
    });

    categories.forEach((cat) => {
      const id = cat._id.toString();
      const node = map[id];
      const parentId = cat.parentId ? cat.parentId.toString() : null;

      if (parentId && map[parentId]) {
        map[parentId].children.push(node);
      } else if (!parentId) {
        tree.push(node);
      }
    });

    return tree;
  }

  /** Bulk update status for multiple categories */
  async bulkToggleStatus(ids: string[], isActive: boolean) {
    return this.categoryModel.updateMany({ _id: { $in: ids }, deletedAt: null }, { $set: { isActive } }).exec();
  }

  /** Category Dashboard Stats */
  async getStats() {
    const [total, root, sub] = await Promise.all([
      this.categoryModel.countDocuments({ deletedAt: null }).exec(),
      this.categoryModel.countDocuments({ deletedAt: null, parentId: null }).exec(),
      this.categoryModel.countDocuments({ deletedAt: null, parentId: { $ne: null } }).exec()
    ]);
    return { total, rootCategories: root, subCategories: sub };
  }
}
