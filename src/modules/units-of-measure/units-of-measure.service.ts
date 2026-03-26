import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UnitOfMeasure, UomDocument } from './unit-of-measure.schema';
import { CreateUomDto } from './dto/create-uom.dto';
import { UpdateUomDto } from './dto/update-uom.dto';
import { FindAllUomDto } from './dto/find-all-uom.dto';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Injectable()
export class UnitsOfMeasureService {
  constructor(@InjectModel(UnitOfMeasure.name) private uomModel: Model<UomDocument>) {}

  private readonly defaultPopulate = [{ path: 'baseUnitId', select: 'name code' }];

  /** Get lightweight unit of measure list for selection dropdowns */
  async getLookup(): Promise<UnitOfMeasure[]> {
    return this.uomModel.find({ deletedAt: null, isActive: true }, 'name code').lean().exec() as any;
  }

  /** Get paginated, filtered, and searchable unit of measure list */
  async findAll(params: FindAllUomDto) {
    const filter: any = { deletedAt: null };
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { code: { $regex: params.search, $options: 'i' } }
      ];
    }
    if (params.isActive !== undefined) filter.isActive = params.isActive;

    const data = await this.uomModel.find(filter).populate(this.defaultPopulate).sort({ name: 1 }).lean().exec();
    return data as any as UnitOfMeasure[];
  }

  /** Get detailed unit of measure information by ID */
  async findById(id: string): Promise<UnitOfMeasure> {
    const uom = await this.uomModel.findOne({ _id: id, deletedAt: null }).populate(this.defaultPopulate).lean().exec();
    if (!uom) throw new NotFoundException(`UOM with ID "${id}" not found`);
    return uom as any as UnitOfMeasure;
  }

  /** Create a new unit of measure */
  async create(createUomDto: CreateUomDto): Promise<UnitOfMeasure> {
    try {
      if (createUomDto.baseUnitId) {
        const base = await this.uomModel.findOne({ _id: createUomDto.baseUnitId, deletedAt: null }).lean().exec();
        if (!base) throw new NotFoundException('Base unit not found');
      }
      const uom = new this.uomModel(createUomDto);
      const saved = await uom.save();
      return saved.toObject() as any as UnitOfMeasure;
    } catch (error) {
      if (error.code === MongoErrorCode.DublicateKey) {
        throw new BadRequestException('UOM code already exists');
      }
      throw new InternalServerErrorException('Error creating UOM');
    }
  }

  /** Update unit of measure details by ID */
  async update(id: string, updateUomDto: UpdateUomDto): Promise<UnitOfMeasure> {
    const uom = await this.uomModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!uom) throw new NotFoundException(`UOM with ID "${id}" not found`);

    if (uom.isUsed && (updateUomDto.code || updateUomDto.conversionFactor)) {
      throw new BadRequestException('Cannot modify code or conversion factor of a unit already used in transactions');
    }

    const updated = await this.uomModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: updateUomDto },
        { returnDocument: 'after', runValidators: true, lean: true }
      )
      .populate(this.defaultPopulate)
      .exec();

    return updated as any as UnitOfMeasure;
  }

  /** Quickly toggle unit of measure active status */
  async toggleStatus(id: string): Promise<UnitOfMeasure> {
    const uom = await this.uomModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      })
      .exec();

    if (!uom) throw new NotFoundException(`UOM with ID "${id}" not found`);
    return uom as any as UnitOfMeasure;
  }

  /** Soft delete unit of measure by ID */
  async softDelete(id: string): Promise<UnitOfMeasure> {
    const uom = await this.uomModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!uom) throw new NotFoundException(`UOM with ID "${id}" not found`);

    const updatePayload = uom.isUsed ? { isActive: false } : { isActive: false, deletedAt: new Date() };

    const deleted = await this.uomModel
      .findOneAndUpdate({ _id: id }, { $set: updatePayload }, { returnDocument: 'after', lean: true })
      .exec();

    return deleted as any as UnitOfMeasure;
  }
}
