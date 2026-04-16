import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Exclude, Transform, Expose, Type } from 'class-transformer';
import { TrackingType } from '@common/enums/tracking-type.enum';
import { ProductCategory } from '@modules/product-categories/product-category.schema';
import { Brand } from '@modules/brands/brand.schema';
import { UnitOfMeasure } from '@modules/units-of-measure/unit-of-measure.schema';
import { ProductPrice } from '@modules/product-prices/product-price.schema';
import { Currency } from '@modules/currencies/schemas/currency.schema';
import { Attribute } from '@modules/attributes/attribute.schema';
import { AttributeValue } from '@modules/attribute-values/attribute-value.schema';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

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
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.UOM, required: true })
  @Type(() => UnitOfMeasure)
  uomId: Types.ObjectId | UnitOfMeasure;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.CATEGORY, required: true })
  @Type(() => ProductCategory)
  categoryId: Types.ObjectId | ProductCategory;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.BRAND })
  @Type(() => Brand)
  brandId: Types.ObjectId | Brand;

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
  @Prop({ default: 0, index: true })
  salePriceDefault: number;

  @Expose()
  @Prop({ default: 0, index: true })
  purchasePriceDefault: number;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.CURRENCY })
  @Type(() => Currency)
  currencyId: Types.ObjectId | Currency;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.PRODUCT, default: null })
  @Type(() => Product)
  parentId: Types.ObjectId | Product | null;

  /*@Expose()
  @Prop({
    type: [
      {
        attributeId: { type: Types.ObjectId, ref: MODEL_NAMES.ATTRIBUTE },
        value: String
      }
    ],
    default: []
  })
  @Type(() => Attribute)
  attributes: { attributeId: Types.ObjectId; value: string }[];*/

  @Expose()
  @Prop({
    type: [
      {
        attributeId: { type: Types.ObjectId, ref: MODEL_NAMES.ATTRIBUTE },
        valueId: { type: Types.ObjectId, ref: MODEL_NAMES.ATTRIBUTE_VALUE }
      }
    ],
    default: []
  })
  @Type(() => Object)
  attributes: { attributeId: Types.ObjectId | Attribute; valueId: Types.ObjectId | AttributeValue }[];

  @Expose()
  @Prop({ default: false })
  isVariantParent: boolean;

  @Expose()
  @Prop({ default: false })
  isUsed: boolean;

  @Expose()
  @Type(() => ProductPrice)
  currentPrice?: ProductPrice;

  @Expose()
  @Type(() => ProductPrice)
  prices?: ProductPrice[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.virtual('prices', {
  ref: MODEL_NAMES.PRODUCT_PRICE,
  localField: '_id',
  foreignField: 'productId'
});

ProductSchema.virtual('currentPrice', {
  ref: MODEL_NAMES.PRODUCT_PRICE,
  localField: '_id',
  foreignField: 'productId',
  justOne: true,
  options: {
    match: { isActive: true },
    sort: { startDate: -1 }
  }
});

ProductSchema.index({ name: 'text', sku: 'text' });
