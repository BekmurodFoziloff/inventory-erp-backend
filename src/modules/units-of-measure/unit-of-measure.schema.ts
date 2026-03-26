import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude, Transform, Expose, Type } from 'class-transformer';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export type UomDocument = UnitOfMeasure & Document;

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
export class UnitOfMeasure {
  @Expose()
  @Transform(({ obj, value }) => obj._id?.toString() || value?.toString() || obj.id)
  id: string;

  @Exclude()
  _id: Types.ObjectId;

  @Exclude()
  __v: number;

  @Expose()
  @Prop({ required: true, unique: true, trim: true })
  name: string; // e.g., "Kilogram", "Piece", "Box"

  @Expose()
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string; // e.g., "KG", "PCS", "BOX"

  /**
   * Conversion factor relative to the base unit.
   * Example: If Base is 'Gram', then 'Kilogram' has factor 1000.
   */
  @Expose()
  @Prop({ default: 1, min: 0.000001 })
  conversionFactor: number;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.UOM, default: null })
  @Type(() => UnitOfMeasure)
  baseUnitId: Types.ObjectId | UnitOfMeasure | null;

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

export const UnitOfMeasureSchema = SchemaFactory.createForClass(UnitOfMeasure);
