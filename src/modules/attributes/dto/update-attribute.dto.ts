import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { IsUnique } from '@common/decorators/is-unique.decorator';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export class UpdateAttributeDto {
  @IsUnique(MODEL_NAMES.ATTRIBUTE)
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateAttributeDto;
