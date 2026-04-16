import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';

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
  @ToObjectId()
  @IsMongoIdObject()
  baseUnitId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateUomDto;
