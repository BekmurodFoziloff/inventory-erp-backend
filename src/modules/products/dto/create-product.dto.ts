import { IsEnum, IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsObject, IsMongoId } from 'class-validator';
import { TrackingType } from '@common/enums/tracking-type.enum';

export class CreateProductDto {
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
}

export default CreateProductDto;
