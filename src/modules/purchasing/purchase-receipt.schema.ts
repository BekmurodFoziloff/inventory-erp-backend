import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, ObjectId } from 'mongoose';
import { Exclude, Transform, Expose } from 'class-transformer';
import { PurchaseReceiptStatus } from '@common/enums/receipt-status.enum';

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
export class PurchaseReceiptLine {
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
  @Prop({ required: true, min: 1 })
  quantity: number;

  @Expose()
  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Expose()
  @Prop()
  lotCode?: string;

  @Expose()
  @Prop()
  expirationDate?: Date;

  @Expose()
  @Prop({ type: [String] })
  serialNumbers?: string[];
}

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
export class PurchaseReceipt {
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
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId: Types.ObjectId;

  @Expose()
  @Prop({ required: true })
  receiptDate: Date;

  @Expose()
  @Prop({ required: true, uppercase: true })
  currency: string;

  @Expose()
  @Prop({ enum: PurchaseReceiptStatus, default: PurchaseReceiptStatus.DRAFT })
  status: PurchaseReceiptStatus;

  @Expose()
  @Prop({ type: [PurchaseReceiptLine], required: true })
  lines: PurchaseReceiptLine[];

  @Expose()
  @Prop()
  invoiceNumber?: string;

  @Expose()
  @Prop()
  comment?: string;

  @Expose()
  @Prop()
  cancellationReason?: string;
}

export const PurchaseReceiptSchema = SchemaFactory.createForClass(PurchaseReceipt);
