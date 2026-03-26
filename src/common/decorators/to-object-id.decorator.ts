import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export function ToObjectId() {
  return Transform(({ value }) => {
    if (value && typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value;
  });
}
