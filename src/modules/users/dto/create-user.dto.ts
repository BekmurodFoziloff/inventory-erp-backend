import { IsString, IsNotEmpty, IsEmail, IsEnum, IsArray, MinLength, MaxLength, Matches } from 'class-validator';
import { IsUniqueUsername } from '@common/validators/is-unique-username.validator';
import { IsUniqueEmail } from '@common/validators/is-unique-email.validator';
import { IsPasswordMatching } from '@common/validators/is-password-matching.validator';
import Role from '@common/enums/role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username is too short' })
  @MaxLength(20, { message: 'Username is too long' })
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and dots'
  })
  @IsUniqueUsername()
  username: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsUniqueEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(16)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. Must contain uppercase, lowercase, and numbers/special chars.'
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsPasswordMatching('password', { message: 'Passwords do not match' })
  passwordConfirm: string;

  @IsArray()
  @IsEnum(Role, { each: true, message: 'Invalid role provided' })
  roles?: Role[];
}

export default CreateUserDto;
