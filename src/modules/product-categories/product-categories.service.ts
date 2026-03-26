import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductCategory, ProductCategoryDocument } from './product-category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BulkUpdateStatusDto } from '../../common/dto/bulk-update-status.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(@InjectModel(ProductCategory.name) private categoryModel: Model<ProductCategoryDocument>) {}

  private readonly defaultPopulate = { path: 'parentId', select: 'name slug' };

  /** Get category dashboard statistics */
  async getStats() {
    const [total, root, sub] = await Promise.all([
      this.categoryModel.countDocuments({ deletedAt: null }).exec(),
      this.categoryModel.countDocuments({ deletedAt: null, parentId: null }).exec(),
      this.categoryModel.countDocuments({ deletedAt: null, parentId: { $ne: null } }).exec()
    ]);
    return { total, rootCategories: root, subCategories: sub };
  }

  /** Get lightweight category list for selection dropdowns */
  async getLookup(): Promise<ProductCategory[]> {
    const data = await this.categoryModel.find({ deletedAt: null, isActive: true }, 'name parentId').lean().exec();
    return data as any as ProductCategory[];
  }

  /** Get hierarchical tree structure of categories */
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
      const parentId = cat.parentId ? cat.parentId.toString() : null;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[id]);
      } else if (!parentId) {
        tree.push(map[id]);
      }
    });
    return tree;
  }

  /** Get full path (breadcrumbs) for a specific category */
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

  /** Get paginated, filtered, and searchable category list */
  async findAll(params: { search?: string; isActive?: boolean }): Promise<ProductCategory[]> {
    const filter: any = { deletedAt: null };
    if (params.search) filter.name = { $regex: params.search, $options: 'i' };
    if (params.isActive !== undefined) filter.isActive = params.isActive;

    const data = await this.categoryModel.find(filter).populate(this.defaultPopulate).sort({ name: 1 }).lean().exec();

    return data as any as ProductCategory[];
  }

  /** Get detailed category information by ID */
  async findById(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel
      .findOne({ _id: id, deletedAt: null })
      .populate(this.defaultPopulate)
      .lean()
      .exec();

    if (!category) throw new NotFoundException(`Category with ID "${id}" not found`);
    return category as any as ProductCategory;
  }

  /** Create a new category */
  async create(createCategoryDto: CreateCategoryDto): Promise<ProductCategory> {
    try {
      if (createCategoryDto.parentId) {
        const parent = await this.categoryModel
          .findOne({ _id: createCategoryDto.parentId, deletedAt: null })
          .lean()
          .exec();
        if (!parent) throw new NotFoundException(`Parent Category "${createCategoryDto.parentId}" not found`);
      }

      const slug = createCategoryDto.name.toLowerCase().trim().replace(/\s+/g, '-');
      const category = new this.categoryModel({ ...createCategoryDto, slug });
      const saved = await category.save();
      const populated = await saved.populate(this.defaultPopulate);
      return populated.toObject() as any as ProductCategory;
    } catch (error) {
      throw error;
    }
  }

  /** Update category details by ID */
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<ProductCategory> {
    const category = await this.categoryModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!category) throw new NotFoundException(`Category with ID "${id}" not found`);

    if (updateCategoryDto.parentId && updateCategoryDto.parentId === id)
      throw new BadRequestException('A category cannot be its own parent');

    const updateBody: any = { ...updateCategoryDto };
    if (updateCategoryDto.name) updateBody.slug = updateCategoryDto.name.toLowerCase().trim().replace(/\s+/g, '-');

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

  /** Quickly toggle category active status */
  async toggleStatus(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      })
      .exec();

    if (!category) throw new NotFoundException(`Category with ID "${id}" not found`);
    return category as any as ProductCategory;
  }

  /** Soft delete category by ID */
  async softDelete(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!category) throw new NotFoundException(`Category with ID "${id}" not found`);

    const hasChildren = await this.categoryModel.findOne({ parentId: id, deletedAt: null }).lean().exec();
    if (hasChildren) throw new BadRequestException('Cannot delete category with active sub-categories');

    const updatePayload = category.isUsed ? { isActive: false } : { isActive: false, deletedAt: new Date() };

    const result = await this.categoryModel
      .findOneAndUpdate({ _id: id }, { $set: updatePayload }, { returnDocument: 'after', lean: true })
      .exec();

    return result as any as ProductCategory;
  }

  /** Mass update active status for multiple categories */
  async bulkToggleStatus(bulkUpdateStatus: BulkUpdateStatusDto) {
    return this.categoryModel
      .updateMany(
        { _id: { $in: bulkUpdateStatus.ids }, deletedAt: null },
        { $set: { isActive: bulkUpdateStatus.isActive } }
      )
      .exec();
  }
}
