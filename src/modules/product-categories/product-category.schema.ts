import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Expose, Transform, Exclude, Type } from 'class-transformer';

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
export class ProductCategory {
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
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Expose()
  @Prop({ type: Types.ObjectId, ref: ProductCategory.name, default: null })
  @Type(() => ProductCategory)
  parentId: Types.ObjectId | ProductCategory | null;

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

export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);

ProductCategorySchema.index({ parentId: 1 });
