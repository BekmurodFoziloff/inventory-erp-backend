import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, ObjectId } from 'mongoose';
import { Exclude, Transform, Expose } from 'class-transformer';
import { TrackingType } from '@common/enums/tracking-type.enum';

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
export class Product {
  @Expose()
  @Transform(({ obj }) => {
    return obj._id ? obj._id.toString() : obj.id;
  })
  id: string;

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: number;

  @Expose()
  @Prop({ required: true, trim: true })
  name: string;

  @Expose()
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  sku: string;

  @Expose()
  @Prop({ required: true })
  unitOfMeasure: string;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: 'ProductCategory', required: true })
  categoryId: Types.ObjectId;

  @Expose()
  @Prop({ required: true, enum: TrackingType })
  trackingType: TrackingType;

  @Expose()
  @Prop({ default: true })
  isActive: boolean;

  @Expose()
  @Prop({ default: null })
  deletedAt: Date | null;

  @Expose()
  @Prop()
  barcode: string;

  @Expose()
  @Prop({ default: 0 })
  minStockLevel: number;

  @Expose()
  @Prop({ default: 0 })
  salePriceDefault: number;

  @Expose()
  @Prop({ default: 0 })
  purchasePriceDefault: number;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: 'Product', default: null })
  parentId: Types.ObjectId;

  @Expose()
  @Prop({ type: Object })
  variantAttributes: Record<string, string>;

  @Expose()
  @Prop({ default: false })
  isVariantParent: boolean;

  @Expose()
  @Prop({ default: false })
  isUsed: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text' });
