import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ValidatorConstraint({ name: 'isUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(@InjectConnection() private connection: Connection) {}

  async validate(value: any, args: ValidationArguments) {
    const [modelName] = args.constraints;
    try {
      const model = this.connection.model(modelName);
      const exists = await model
        .findOne({
          [args.property]: value,
          deletedAt: null
        })
        .lean();
      return !exists;
    } catch (e) {
      console.error('Validation Error:', e.message);
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const field = args.property.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
    return `${field} "${args.value}" is already in use. Please provide a unique ${field.toLowerCase()}.`;
  }
}

export function IsUnique(modelName: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [modelName],
      validator: IsUniqueConstraint
    });
  };
}
