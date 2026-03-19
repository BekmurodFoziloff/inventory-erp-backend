import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Exclude, Transform, Expose, Type } from 'class-transformer';
import { TrackingType } from '@common/enums/tracking-type.enum';
import { ProductCategory } from '@modules/product-categories/product-category.schema';

export type ProductDocument = Product & Document;

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
  @Transform(({ obj, value }) => obj._id?.toString() || value?.toString() || obj.id)
  id: string;

  @Exclude()
  _id: Types.ObjectId;

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
  @Prop({ type: Types.ObjectId, ref: ProductCategory.name })
  @Type(() => ProductCategory)
  categoryId: Types.ObjectId | ProductCategory;

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
  @Prop({ type: Types.ObjectId, ref: Product.name, default: null })
  @Type(() => Product)
  parentId: Types.ObjectId | Product | null;

  @Expose()
  @Transform(({ obj }) => obj.variantAttributes)
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

ProductSchema.index({ name: 'text', sku: 'text' });
