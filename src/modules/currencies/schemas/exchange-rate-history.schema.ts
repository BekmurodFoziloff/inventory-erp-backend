import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform, Expose, Type } from 'class-transformer';
import { Currency } from './currency.schema';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export type ExchangeRateHistoryDocument = ExchangeRateHistory & Document;

@Schema({ timestamps: true })
export class ExchangeRateHistory {
  @Expose()
  @Transform(({ obj, value }) => obj._id?.toString() || value?.toString() || obj.id)
  id: string;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: MODEL_NAMES.EXCHANGE_HISTORY, required: true, index: true })
  @Type(() => Currency)
  currencyId: Currency | Types.ObjectId;

  @Expose()
  @Prop({ required: true })
  rate: number;

  @Expose()
  @Prop({ required: true, index: true })
  date: Date;

  @Expose()
  @Prop({ default: 'CBU_API' })
  source: string;
}

export const ExchangeRateHistorySchema = SchemaFactory.createForClass(ExchangeRateHistory);

ExchangeRateHistorySchema.index({ currencyId: 1, date: 1 }, { unique: true });
