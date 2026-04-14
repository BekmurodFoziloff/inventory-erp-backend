import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude, Transform, Expose, Type } from 'class-transformer';
import { PriceType } from '@common/enums/price-type.enum';
import { Product } from '@modules/products/product.schema';
import { Currency } from '@modules/currencies/currency.schema';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export type ProductPriceDocument = ProductPrice & Document;

@Schema({ timestamps: true })
export class ProductPrice {
  @Expose()
  @Transform(({ obj, value }) => obj._id?.toString() || value?.toString() || obj.id)
  id: string;

  @Exclude()
  _id: Types.ObjectId;

  @Exclude()
  __v: number;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.PRODUCT, required: true, index: true })
  @Type(() => Product)
  productId: Product | Types.ObjectId;

  @Expose()
  @Prop({ required: true, enum: PriceType })
  priceType: PriceType;

  @Expose()
  @Prop({ required: true, min: 0 })
  amount: number;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.CURRENCY, required: true })
  @Type(() => Currency)
  currencyId: Types.ObjectId | Currency;

  @Expose()
  @Prop({ required: true, default: Date.now })
  startDate: Date;

  @Expose()
  @Prop({ default: null })
  endDate: Date | null;

  @Expose()
  @Prop({ default: true })
  isActive: boolean;
}
export const ProductPriceSchema = SchemaFactory.createForClass(ProductPrice);

ProductPriceSchema.index({ productId: 1, priceType: 1, startDate: -1 });
