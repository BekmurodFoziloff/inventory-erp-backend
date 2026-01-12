import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { IsUniqueEmail } from '@common/validators/is-unique-email.validator';

export class CreateUserDto {
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
}

export default CreateUserDto;
