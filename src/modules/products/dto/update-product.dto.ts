import { IsEnum, IsString, IsNotEmpty, IsOptional, IsNumber, IsObject, IsBoolean } from 'class-validator';
import { TrackingType } from '@common/enums/tracking-type.enum';
import { IsUnique } from '@common/decorators/is-unique.decorator';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsUnique(MODEL_NAMES.PRODUCT)
  @IsString()
  @IsNotEmpty()
  sku?: string;

  @IsOptional()
  @ToObjectId()
  @IsMongoIdObject()
  @IsNotEmpty()
  uomId?: string;

  @IsOptional()
  @ToObjectId()
  @IsMongoIdObject()
  @IsNotEmpty()
  categoryId?: string;

  @IsOptional()
  @ToObjectId()
  @IsMongoIdObject()
  @IsNotEmpty()
  brandId?: string;

  @IsOptional()
  @IsEnum(TrackingType)
  trackingType?: TrackingType;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  minStockLevel?: number;

  @IsOptional()
  @IsNumber()
  salePriceDefault?: number;

  @IsOptional()
  @IsNumber()
  purchasePriceDefault?: number;

  @IsOptional()
  @IsBoolean()
  isVariantParent?: boolean;

  @IsOptional()
  @ToObjectId()
  @IsMongoIdObject()
  parentId?: string;

  @IsOptional()
  @IsObject()
  variantAttributes?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateProductDto;
