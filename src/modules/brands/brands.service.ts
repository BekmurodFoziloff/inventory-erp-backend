import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from './brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FindAllBrandsDto } from './dto/find-all-brands.dto';

@Injectable()
export class BrandsService {
  constructor(@InjectModel(Brand.name) private brandModel: Model<BrandDocument>) {}

  /** Get brand dashboard statistics */
  async getStats() {
    const [total, active] = await Promise.all([
      this.brandModel.countDocuments({ deletedAt: null }).exec(),
      this.brandModel.countDocuments({ deletedAt: null, isActive: true }).exec()
    ]);
    return { total, active };
  }

  /** Get lightweight brand list for selection dropdowns */
  async getLookup(): Promise<Brand[]> {
    return this.brandModel.find({ deletedAt: null, isActive: true }, 'name').sort({ name: 1 }).lean().exec() as any;
  }

  /** Get paginated, filtered, and searchable brand list */
  async findAll(params: FindAllBrandsDto) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const filter: any = { deletedAt: null };
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      this.brandModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean().exec(),
      this.brandModel.countDocuments(filter).exec()
    ]);

    return { data: data as any as Brand[], total, page, lastPage: Math.ceil(total / limit) };
  }

  /** Get detailed brand information by ID */
  async findById(id: string): Promise<Brand> {
    const brand = await this.brandModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!brand) throw new NotFoundException(`Brand with ID "${id}" not found`);
    return brand as any as Brand;
  }

  /** Create a new brand */
  async create(updateBrandDto: CreateBrandDto): Promise<Brand> {
    try {
      const brand = new this.brandModel(updateBrandDto);
      const saved = await brand.save();
      return saved.toObject() as any as Brand;
    } catch (error) {
      throw error;
    }
  }

  /** Update brand details by ID */
  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.brandModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: updateBrandDto },
        { returnDocument: 'after', runValidators: true, lean: true }
      )
      .exec();

    if (!brand) throw new NotFoundException(`Brand with ID "${id}" not found`);
    return brand as any as Brand;
  }

  /** Quickly toggle brand active status */
  async toggleStatus(id: string): Promise<Brand> {
    const brand = await this.brandModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      })
      .exec();

    if (!brand) throw new NotFoundException(`Brand with ID "${id}" not found`);
    return brand as any as Brand;
  }

  /** Soft delete brand by ID */
  async softDelete(id: string): Promise<Brand> {
    const brand = await this.brandModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!brand) throw new NotFoundException(`Brand with ID "${id}" not found`);

    const updatePayload = brand.isUsed ? { isActive: false } : { isActive: false, deletedAt: new Date() };

    const deleted = await this.brandModel
      .findOneAndUpdate({ _id: id }, { $set: updatePayload }, { returnDocument: 'after', lean: true })
      .exec();

    return deleted as any as Brand;
  }

  /** Mass update active status for multiple brands */
  async bulkToggleStatus(ids: string[], isActive: boolean) {
    return this.brandModel.updateMany({ _id: { $in: ids }, deletedAt: null }, { $set: { isActive } }).exec();
  }
}
