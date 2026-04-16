import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude, Transform, Expose, Type } from 'class-transformer';
import { AttributeValue } from '@modules/attribute-values/attribute-value.schema';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export type AttributeDocument = Attribute & Document;

@Schema({
  toJSON: {
    virtuals: true,
    getters: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  timestamps: true
})
export class Attribute {
  @Expose()
  @Transform(({ obj, value }) => obj._id?.toString() || value?.toString() || obj.id)
  id: string;

  @Exclude()
  _id: Types.ObjectId;

  @Exclude()
  __v: number;

  @Expose()
  @Prop({ required: true, unique: true, trim: true })
  name: string; // e.g., "Color", "Size", "Material"

  @Expose()
  @Prop({ default: true })
  isActive: boolean;

  @Expose()
  @Prop({ default: null })
  deletedAt: Date | null;

  @Expose()
  @Prop({ default: false })
  isUsed: boolean;

  @Expose()
  @Type(() => AttributeValue)
  values?: AttributeValue[];
}

export const AttributeSchema = SchemaFactory.createForClass(Attribute);

AttributeSchema.virtual('values', {
  ref: MODEL_NAMES.ATTRIBUTE_VALUE,
  localField: '_id',
  foreignField: 'attributeId'
});
