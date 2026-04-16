import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AttributeValue, AttributeValueDocument } from './attribute-value.schema';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';

@Injectable()
export class AttributeValuesService {
  constructor(@InjectModel(AttributeValue.name) private valueModel: Model<AttributeValueDocument>) {}

  /** Find all values for a specific attribute */
  async findByAttribute(attributeId: string): Promise<AttributeValue[]> {
    const data = await this.valueModel
      .find({ attributeId, deletedAt: null, isActive: true })
      .sort({ name: 1 })
      .lean()
      .exec();
    return data as any as AttributeValue[];
  }

  /** Find single value by ID */
  async findById(id: string): Promise<AttributeValue> {
    const value = await this.valueModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!value) throw new NotFoundException(`Attribute value with ID "${id}" not found`);
    return value as any as AttributeValue;
  }

  /** Create a new attribute value (e.g., adding "Red" to "Color") */
  async create(createValueDto: CreateAttributeValueDto): Promise<AttributeValue> {
    try {
      const newValue = new this.valueModel(createValueDto);
      const saved = await newValue.save();
      return saved.toObject() as any as AttributeValue;
    } catch (error) {
      throw error;
    }
  }

  /** Update attribute value details (e.g., fixing a typo) */
  async update(id: string, updateValueDto: UpdateAttributeValueDto): Promise<AttributeValue> {
    try {
      const updated = await this.valueModel
        .findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: updateValueDto },
          { returnDocument: 'after', lean: true, runValidators: true }
        )
        .exec();

      if (!updated) {
        throw new NotFoundException(`Attribute value with ID ID "${id}" not found`);
      }

      return updated as any as AttributeValue;
    } catch (error) {
      throw error;
    }
  }

  /** Quickly toggle value status */
  async toggleStatus(id: string): Promise<AttributeValue> {
    const updated = await this.valueModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      })
      .exec();

    if (!updated) throw new NotFoundException(`Attribute value with ID "${id}" not found`);
    return updated as any as AttributeValue;
  }

  /** Soft delete value if not used in products */
  async softDelete(id: string): Promise<AttributeValue> {
    const value = await this.valueModel.findById(id).exec();
    if (!value) throw new NotFoundException(`Attribute value with ID "${id}" not found`);

    if (value.isUsed) {
      value.isActive = false;
      const saved = await value.save();
      return saved.toObject() as any as AttributeValue;
    }

    const deleted = await this.valueModel
      .findOneAndUpdate(
        { _id: id },
        { $set: { deletedAt: new Date(), isActive: false } },
        { returnDocument: 'after', lean: true }
      )
      .exec();

    return deleted as any as AttributeValue;
  }
}
