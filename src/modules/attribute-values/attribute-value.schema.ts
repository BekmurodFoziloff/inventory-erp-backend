import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Expose, Transform, Exclude, Type } from 'class-transformer';
import { MODEL_NAMES } from '@common/constants/model-names.contant';
import { Attribute } from '@modules/attributes/attribute.schema';

export type AttributeValueDocument = AttributeValue & Document;

@Schema({
  toJSON: {
    getters: true,
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  timestamps: true
})
export class AttributeValue {
  @Expose()
  @Transform(({ obj, value }) => obj._id?.toString() || value?.toString() || obj.id)
  id: string;

  @Exclude()
  _id: Types.ObjectId;

  @Exclude()
  __v: number;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.ATTRIBUTE, required: true, index: true })
  @Type(() => Attribute)
  attributeId: Types.ObjectId | Attribute;

  @Expose()
  @Prop({ required: true, trim: true })
  name: string; // e.g., "Red", "XL", "Cotton"

  @Expose()
  @Prop({ default: true })
  isActive: boolean;

  @Expose()
  @Prop({ default: null })
  deletedAt: Date | null;

  @Expose()
  @Prop({ default: false })
  isUsed: boolean;
}

export const AttributeValueSchema = SchemaFactory.createForClass(AttributeValue);

AttributeValueSchema.index({ attributeId: 1, name: 1, deletedAt: 1 }, { unique: true });
