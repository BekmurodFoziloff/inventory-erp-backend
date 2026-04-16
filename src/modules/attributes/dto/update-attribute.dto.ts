import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateAttributeDto {
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
