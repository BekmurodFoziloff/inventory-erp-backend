import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, ObjectId } from 'mongoose';
import { Exclude, Transform, Expose } from 'class-transformer';

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
export class StockBalance {
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
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId: Types.ObjectId;

  @Expose()
  @Prop({ default: 0, min: 0 })
  quantity: number;

  @Expose()
  @Prop()
  lotCode?: string;

  @Expose()
  @Prop()
  expirationDate?: Date;

  @Expose()
  @Prop({ unique: true, sparse: true })
  serialNumber?: string;
}

export const StockBalanceSchema = SchemaFactory.createForClass(StockBalance);
StockBalanceSchema.index({ productId: 1, warehouseId: 1, lotCode: 1, expirationDate: 1 });
