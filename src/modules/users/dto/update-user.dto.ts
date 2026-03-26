import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
  Matches
} from 'class-validator';
import Role from '@common/enums/role.enum';
import { IsUnique } from '@common/decorators/is-unique.decorator';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export class UpdateUserDto {
  @IsOptional()
  @IsUnique(MODEL_NAMES.USER)
  @IsString()
  @MinLength(3, { message: 'Username is too short' })
  @MaxLength(20, { message: 'Username is too long' })
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and dots'
  })
  username?: string;

  @IsOptional()
  @IsUnique(MODEL_NAMES.USER)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true, message: 'Invalid role provided' })
  roles?: Role[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateUserDto;
