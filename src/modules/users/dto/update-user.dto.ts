import { IsString, IsEmail, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username is too short' })
  @MaxLength(20, { message: 'Username is too long' })
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and dots'
  })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateUserDto;
