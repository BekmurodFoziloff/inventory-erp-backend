import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'isMongoIdObject', async: false })
export class IsMongoIdObjectConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    return Types.ObjectId.isValid(value);
  }

  defaultMessage({ property }) {
    return `${property} must be a valid mongodb id`;
  }
}

export function IsMongoIdObject(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMongoIdObjectConstraint
    });
  };
}
