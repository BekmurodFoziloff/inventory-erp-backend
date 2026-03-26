import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsMongoId, Min } from 'class-validator';

export class CreateUomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  conversionFactor?: number;

  @IsOptional()
  @IsMongoId()
  baseUnitId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default CreateUomDto;
