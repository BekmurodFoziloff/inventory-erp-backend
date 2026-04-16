import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';
import { TrackingType } from '@common/enums/tracking-type.enum';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';
import { ProductAttributeDto } from './product-attribute.dto';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateProductDto;
