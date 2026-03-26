import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { PriceType } from '@common/enums/price-type.enum';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';

export class CreateProductPriceDto {
  @ToObjectId()
  @IsMongoIdObject()
  @IsNotEmpty()
  productId: string;

  @IsEnum(PriceType)
  @IsNotEmpty()
  priceType: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}

export default CreateProductPriceDto;
