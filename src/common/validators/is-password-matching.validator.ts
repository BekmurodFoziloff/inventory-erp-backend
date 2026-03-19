import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsPasswordMatchingValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    const [relatedPropertyName] = validationArguments.constraints;
    const propertyName = validationArguments.property;
    return `User ${relatedPropertyName} must be match to ${propertyName} exactly`;
  }
}

export function IsPasswordMatching(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsPasswordMatchingValidator
    });
  };
}
