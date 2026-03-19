import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateBrandDto;
