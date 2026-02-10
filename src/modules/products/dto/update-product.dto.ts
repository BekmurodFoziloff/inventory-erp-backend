import { IsEnum, IsString, IsNotEmpty, IsOptional, IsNumber, IsObject, IsMongoId, IsBoolean } from 'class-validator';
import { TrackingType } from '@common/enums/tracking-type.enum';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  unitOfMeasure: string;

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
  @IsMongoId()
  parentId?: string;

  @IsOptional()
  @IsObject()
  variantAttributes?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateProductDto;
