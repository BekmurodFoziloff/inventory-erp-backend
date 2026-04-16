import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude, Transform, Expose } from 'class-transformer';

export type CurrencyDocument = Currency & Document;

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
export class Currency {
  @Expose()
  @Transform(({ obj, value }) => obj._id?.toString() || value?.toString() || obj.id)
  id: string;

  @Exclude()
  _id: Types.ObjectId;

  @Exclude()
  __v: number;

  @Expose()
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string; // ISO code: USD, UZS, EUR

  @Expose()
  @Prop({ required: true, trim: true })
  name: string; // e.g., "US Dollar", "Uzbek Sum"

  @Expose()
  @Prop({ required: true, trim: true })
  symbol: string; // e.g., "$", "sum"

  /**
   * Value relative to the base currency.
   * If this is the Base Currency, the rate must be 1.
   */
  @Expose()
  @Prop({ required: true, default: 1, min: 0.000001 })
  exchangeRate: number;

  /**
   * Only one currency can be the base (primary) currency of the ERP system.
   */
  @Expose()
  @Prop({ default: false })
  isBase: boolean;

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

export const CurrencySchema = SchemaFactory.createForClass(Currency);
