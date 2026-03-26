import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { IsUnique } from '@common/decorators/is-unique.decorator';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export class UpdateUomDto {
  @IsOptional()
  @IsUnique(MODEL_NAMES.UOM)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsUnique(MODEL_NAMES.UOM)
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
