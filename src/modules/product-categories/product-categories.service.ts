import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

  /** Reuseable population for consistency */
  private readonly defaultPopulate = { path: 'parentId', select: 'name slug' };

  /** Create new category with parent validation */
  async create(categoryData: CreateCategoryDto): Promise<ProductCategory> {
    try {
      if (categoryData.parentId) {
        const parent = await this.categoryModel.findById(categoryData.parentId);
        if (!parent || parent.deletedAt)
          throw new NotFoundException(
            `Parent Category with ID "${categoryData.parentId}" not found or has been deleted`
          );
      }

      const slug = categoryData.name.toLowerCase().replace(/ /g, '-');
      const category = new this.categoryModel({ ...categoryData, slug });

      const saved = await category.save();
      return await saved.populate(this.defaultPopulate);
    } catch (error) {
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException('Category name or slug already exists');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  /** Advanced list for Admin with search and status filters */
  async findAll(params: { search?: string; isActive?: boolean }) {
    const filter: any = { deletedAt: null };
    if (params.search) filter.name = { $regex: params.search, $options: 'i' };
    if (params.isActive !== undefined) filter.isActive = params.isActive;

    return this.categoryModel.find(filter).populate(this.defaultPopulate).sort({ name: 1 });
  }

  /** Find by ID with populated parent */
  async findById(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel.findById(id).populate(this.defaultPopulate);

    if (!category || category.deletedAt) {
      throw new NotFoundException(`Category with ID "${id}" not found  or has been deleted`);
    }
    return category;
  }

  /** Update category with circular reference check */
  async update(id: string, categoryData: UpdateCategoryDto): Promise<ProductCategory> {
    await this.findById(id);

    if (categoryData.parentId && categoryData.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const updateData: any = { ...categoryData };
    if (categoryData.name) {
      updateData.slug = categoryData.name.toLowerCase().replace(/ /g, '-');
    }

    return this.categoryModel.findByIdAndUpdate(
      id,
      { $set: categoryData },
      { returnDocument: 'after', runValidators: true }
    );
  }

  /** Quick toggle for isActive status */
  async toggleStatus(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel.findOneAndUpdate({ _id: id, deletedAt: null });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found or has been deleted`);
    }

    category.isActive = !category.isActive;
    await category.save();

    return category;
  }

  /** Soft delete with dependency checks */
  async softDelete(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel.findById(id);

    if (!category || category.deletedAt) {
      throw new NotFoundException(`Category with ID "${id}" not found or has been deleted`);
    }

    // Check for children
    const hasChildren = await this.categoryModel.findOne({ parentIdId: id, deletedAt: null });
    if (hasChildren) {
      throw new BadRequestException('Cannot delete Category that has sub-categories');
    }

    // If used by products, just deactivate
    if (category.isUsed) {
      category.isActive = false;
      return await category.save();
    }

    category.deletedAt = new Date();
    category.isActive = false;
    return await category.save();
  }

  /** Get lightweight list for dropdowns */
  async getLookup() {
    return this.categoryModel.find({ deletedAt: null, isActive: true }, 'name parentId');
  }

  /** Get Breadcrumbs: e.g. "Electronics > Phones > Smartphones" */
  async getAncestors(id: string) {
    const ancestors = [];
    let currentId = id;

    while (currentId) {
      const category = await this.categoryModel.findById(currentId, 'name parentId');
      if (!category) break;
      ancestors.unshift(category); // Add to beginning of array
      currentId = category.parentId ? category.parentId.toString() : null;
    }
    return ancestors;
  }

  /** Get hierarchical tree structure of categories */
  async getTree(): Promise<any[]> {
    const allCategories = await this.categoryModel.find({ deletedAt: null, isActive: true }).lean().exec();

    const categoryMap: Record<string, any> = {};
    allCategories.forEach((cat) => {
      categoryMap[cat._id.toString()] = {
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        isActive: cat.isActive,
        children: []
      };
    });

    const rootNodes = [];
    allCategories.forEach((cat) => {
      const id = cat._id.toString();
      const parentId = cat.parentId ? cat.parentId.toString() : null;

      if (parentId && categoryMap[parentId]) {
        categoryMap[parentId].children.push(categoryMap[id]);
      } else if (!parentId) {
        rootNodes.push(categoryMap[id]);
      }
    });

    return rootNodes;
  }
  /** Bulk deactivate categories */
  async bulkToggleStatus(ids: string[], isActive: boolean) {
    return this.categoryModel.updateMany({ id: { $in: ids } }, { $set: { isActive } });
  }

  /** Category Dashboard Stats */
  async getStats() {
    const [total, root, sub] = await Promise.all([
      this.categoryModel.countDocuments({ deletedAt: null }),
      this.categoryModel.countDocuments({ deletedAt: null, parentId: null }),
      this.categoryModel.countDocuments({ deletedAt: null, parentId: { $ne: null } })
    ]);
    return { total, rootCategories: root, subCategories: sub };
  }
}
