import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { IsUnique } from '@common/decorators/is-unique.decorator';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export class UpdateBrandDto {
  @IsUnique(MODEL_NAMES.BRAND)
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
