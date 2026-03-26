import { IsEnum, IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsObject } from 'class-validator';
import { TrackingType } from '@common/enums/tracking-type.enum';
import { IsUnique } from '@common/decorators/is-unique.decorator';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';
import { MODEL_NAMES } from '@common/constants/model-names.contant';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUnique(MODEL_NAMES.PRODUCT)
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ToObjectId()
  @IsMongoIdObject()
  @IsNotEmpty()
  uomId: string;

  @ToObjectId()
  @IsMongoIdObject()
  @IsNotEmpty()
  categoryId: string;

  @ToObjectId()
  @IsMongoIdObject()
  @IsNotEmpty()
  brandId: string;

  @IsEnum(TrackingType)
  trackingType: TrackingType;

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
}

export default CreateProductDto;
