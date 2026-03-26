import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsMongoId, Min } from 'class-validator';

export class UpdateUomDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001, { message: 'Conversion factor must be greater than zero' })
  conversionFactor?: number;

  @IsOptional()
  @IsMongoId()
  baseUnitId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateUomDto;
