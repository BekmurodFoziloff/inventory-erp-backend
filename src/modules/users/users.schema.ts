import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { Exclude, Transform, Expose } from 'class-transformer';
import SerializeDate from '@common/decorators/serialize-date.decorator';
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
  @Transform(({ obj }) => {
    return obj._id ? obj._id.toString() : obj.id;
  })
  id: string;

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: number;

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

  @Prop({ type: String })
  @Exclude()
  currentHashedRefreshToken: string;

  @Expose()
  @SerializeDate()
  createdAt: Date;

  @Expose()
  @SerializeDate()
  updatedAt: Date;

  @Expose()
  get fullName(): string {
    return `${this.firstName}${this.lastName ? ' ' + this.lastName : ''}`;
  }
}

const UserSchema = SchemaFactory.createForClass(User);

export { UserSchema };
