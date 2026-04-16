import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateAttributeDto {
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
