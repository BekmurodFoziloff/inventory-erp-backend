import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude, Transform, Expose } from 'class-transformer';
import { AttributeValue } from '@modules/attribute-values/attribute-value.schema';

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
  @Prop({ type: [AttributeValue], default: [] })
  values: AttributeValue[];

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

export const AttributeSchema = SchemaFactory.createForClass(Attribute);
