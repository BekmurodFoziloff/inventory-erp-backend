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
export class IsUniqueUsernameValidator implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}
  async validate(username: string) {
    const user = await this.usersService.getByUsername(username);
    return !user;
  }

  defaultMessage(): string {
    return 'User $property with this $value already exists';
  }
}

export function IsUniqueUsername(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueUsernameValidator
    });
  };
}
