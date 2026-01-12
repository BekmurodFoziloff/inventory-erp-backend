import { IsNotEmpty, IsString } from 'class-validator';
import CreateUserDto from '@modules/users/dto/create-user.dto';
import { IsPasswordMatching } from '@common/validators/is-password-matching.validator';

export class RegisterDto extends CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsPasswordMatching('password', { message: 'Passwords do not match' })
  passwordConfirm: string;
}

export default RegisterDto;
