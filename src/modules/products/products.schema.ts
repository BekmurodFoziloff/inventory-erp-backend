import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, ObjectId } from 'mongoose';
import { Transform } from 'class-transformer';
import { TrackingType } from '@common/enums/tracking-type.enum';

@Schema({
  toJSON: {
    getters: true,
    virtuals: true
  },
  timestamps: true
})
export class Product {
  @Transform(({ value }) => value.toString())
  _id: ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  sku: string;

  @Prop({ required: true })
  unitOfMeasure: string;

  @Prop({ required: true, enum: TrackingType })
  trackingType: TrackingType;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;

  @Prop()
  barcode: string;

  @Prop({ default: 0 })
  minStockLevel: number;

  @Prop({ default: 0 })
  salePriceDefault: number;

  @Prop({ default: 0 })
  purchasePriceDefault: number;

  @Prop({ type: Types.ObjectId, ref: 'Product', default: null })
  parentId: Types.ObjectId;

  @Prop({ type: Object })
  variantAttributes: Record<string, string>;

  @Prop({ default: false })
  isVariantParent: boolean;

  @Prop({ default: false })
  isUsed: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ name: 'text' });
