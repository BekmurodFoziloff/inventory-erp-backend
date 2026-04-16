import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attribute, AttributeDocument } from './attribute.schema';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import FindAllAttributesDto from './dto/find-all-attributes.dto';

@Injectable()
export class AttributesService {
  constructor(@InjectModel(Attribute.name) private attributeModel: Model<AttributeDocument>) {}

  /** Get attribute dashboard statistics */
  async getStats() {
    const [total, active] = await Promise.all([
      this.attributeModel.countDocuments({ deletedAt: null }).exec(),
      this.attributeModel.countDocuments({ deletedAt: null, isActive: true }).exec()
    ]);
    return { total, active };
  }

  /** Get lightweight list for selection dropdowns */
  async getLookup(): Promise<Attribute[]> {
    return this.attributeModel.find({ deletedAt: null, isActive: true }, 'name values').lean().exec() as any;
  }

  /** Find all attributes with filtering */
  async findAll(params: FindAllAttributesDto) {
    const filter: any = { deletedAt: null };
    if (params.search) filter.name = { $regex: params.search, $options: 'i' };
    if (params.isActive !== undefined) filter.isActive = params.isActive;

    const data = await this.attributeModel.find(filter).sort({ name: 1 }).lean().exec();
    return data as any as Attribute[];
  }

  /** Find specific attribute by ID */
  async findById(id: string): Promise<Attribute> {
    const attribute = await this.attributeModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!attribute) throw new NotFoundException(`Attribute with ID "${id}" not found`);
    return attribute as any as Attribute;
  }

  /** Create new attribute dictionary */
  async create(createAttributeDto: CreateAttributeDto): Promise<Attribute> {
    try {
      const attribute = new this.attributeModel(createAttributeDto);
      const saved = await attribute.save();
      return saved.toObject() as any as Attribute;
    } catch (error) {
      throw error;
    }
  }

  /** Update attribute details */
  async update(id: string, updateAttributeDto: UpdateAttributeDto): Promise<Attribute> {
    const updated = await this.attributeModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: updateAttributeDto },
        { returnDocument: 'after', runValidators: true, lean: true }
      )
      .exec();

    if (!updated) throw new NotFoundException(`Attribute with ID "${id}" not found`);
    return updated as any as Attribute;
  }

  /** Quickly toggle active status */
  async toggleStatus(id: string): Promise<Attribute> {
    const updated = await this.attributeModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      } as any)
      .exec();

    if (!updated) throw new NotFoundException(`Attribute with ID "${id}" not found`);
    return updated as any as Attribute;
  }

  /** Soft delete if not used in products */
  async softDelete(id: string): Promise<Attribute> {
    const attribute = await this.attributeModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!attribute) throw new NotFoundException(`Attribute not found`);

    if (attribute.isUsed) {
      attribute.isActive = false;
      const saved = await attribute.save();
      return saved.toObject() as any as Attribute;
    }

    const deleted = await this.attributeModel
      .findOneAndUpdate(
        { _id: id },
        { $set: { deletedAt: new Date(), isActive: false } },
        { returnDocument: 'after', lean: true }
      )
      .exec();

    return deleted as any as Attribute;
  }
}
