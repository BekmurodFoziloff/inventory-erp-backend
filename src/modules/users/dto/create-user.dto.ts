import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsAlpha, Matches } from 'class-validator';
import { IsUniqueEmail } from '@common/validators/is-unique-email.validator';

export class CreateUserDto {
  @IsEmail()
  @IsUniqueEmail()
  @Matches('[a-z0-9]+@[a-z]+.[a-z]{2,3}')
  email: string;

  @IsString()
  @IsAlpha()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsAlpha()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(16)
  @Matches('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})')
  password: string;
}

export default CreateUserDto;
