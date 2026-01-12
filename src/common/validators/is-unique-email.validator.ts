import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import { UsersService } from '@modules/users/users.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueEmailValidator implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}
  async validate(email: string) {
    return await this.usersService.findByEmail(email).then((email) => {
      if (email) return false;
      return true;
    });
  }

  defaultMessage(): string {
    return 'User $property with this $value already exists';
  }
}

export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueEmailValidator
    });
  };
}
