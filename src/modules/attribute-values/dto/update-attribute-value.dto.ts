import { defaults } from '@hapi/joi';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAttributeValueDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateAttributeValueDto;
