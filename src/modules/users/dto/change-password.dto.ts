import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { IsPasswordMatching } from '@common/validators/is-password-matching.validator';

export class ChangePasswordDto {
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
}

export default ChangePasswordDto;
