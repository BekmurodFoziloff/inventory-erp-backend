import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude, Transform, Expose } from 'class-transformer';
import Role from '@common/enums/role.enum';

export type UserDocument = User & Document;

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
export class User {
  @Expose()
  @Transform(({ obj, value }) => obj._id?.toString() || value?.toString() || obj.id)
  id: string;

  @Exclude()
  _id: Types.ObjectId;

  @Exclude()
  __v: number;

  @Expose()
  @Prop({ type: String, unique: true, required: true, lowercase: true, trim: true })
  username: string;

  @Expose()
  @Prop({ type: String, unique: true, required: true, lowercase: true, trim: true })
  email: string;

  @Expose()
  @Prop({ type: String, required: true, trim: true })
  firstName: string;

  @Expose()
  @Prop({ type: String, trim: true, default: '' })
  lastName: string;

  @Expose()
  @Prop({ type: [String], enum: Role, default: [Role.VIEWER] })
  roles: Role[];

  @Prop({ type: String, required: true })
  @Exclude()
  password: string;

  @Expose()
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  @Exclude()
  currentHashedRefreshToken?: string;

  @Expose()
  @Prop({ default: null })
  deletedAt: Date | null;

  @Expose()
  @Prop({ default: null })
  lastLogin: Date | null;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ default: null })
  lockoutUntil: Date | null;

  @Expose()
  get fullName(): string {
    return `${this.firstName}${this.lastName ? ' ' + this.lastName : ''}`;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
