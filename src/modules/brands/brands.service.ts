import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from './brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class BrandsService {
  constructor(@InjectModel(Brand.name) private brandModel: Model<BrandDocument>) {}

  /** Create a new product brand */
  async create(brandData: CreateBrandDto): Promise<Brand> {
    try {
      const brand = new this.brandModel(brandData);
      const saved = await brand.save();
      return saved.toObject() as any as Brand;
    } catch (error) {
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException(`Brand with name "${brandData.name}" already exists`);
      }
      throw new InternalServerErrorException('Error creating brand');
    }
  }

  /** Get paginated list of brands */
  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const filter: any = { deletedAt: null };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.brandModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean().exec(),
      this.brandModel.countDocuments(filter).exec()
    ]);

    return { data: data as any as Brand[], total, page, lastPage: Math.ceil(total / limit) };
  }

  /** Get single brand by ID */
  async findById(id: string): Promise<Brand> {
    const brand = await this.brandModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!brand) throw new NotFoundException(`Brand with ID "${id}" not found`);
    return brand as any as Brand;
  }

  /** Update brand details atomically */
  async update(id: string, updateData: UpdateBrandDto): Promise<Brand> {
    const brand = await this.brandModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: updateData }, { returnDocument: 'after', lean: true })
      .exec();

    if (!brand) throw new NotFoundException(`Brand with ID "${id}" not found`);
    return brand as any as Brand;
  }

  /** Toggle brand active status atomically */
  async toggleStatus(id: string): Promise<Brand> {
    const brand = await this.brandModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      } as any)
      .exec();

    if (!brand) throw new NotFoundException(`Brand with ID "${id}" not found`);
    return brand as any as Brand;
  }

  /** Soft delete brand or deactivate if referenced by products */
  async softDelete(id: string): Promise<Brand> {
    const brand = await this.brandModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!brand) throw new NotFoundException(`Brand with ID "${id}" not found`);

    if (brand.isUsed) {
      brand.isActive = false;
      const saved = await brand.save();
      return saved.toObject() as any as Brand;
    }

    const deleted = await this.brandModel
      .findOneAndUpdate(
        { _id: id },
        { $set: { deletedAt: new Date(), isActive: false } },
        { returnDocument: 'after', lean: true }
      )
      .exec();

    return deleted as any as Brand;
  }

  /** Lightweight lookup for product creation dropdowns */
  async getLookup(): Promise<Brand[]> {
    return this.brandModel.find({ deletedAt: null, isActive: true }, 'name').sort({ name: 1 }).lean().exec() as any;
  }
}
