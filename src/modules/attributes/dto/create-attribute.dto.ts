import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { IsUnique } from '@common/decorators/is-unique.decorator';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export class CreateAttributeDto {
  @IsUnique(MODEL_NAMES.ATTRIBUTE)
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  values?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default CreateAttributeDto;
