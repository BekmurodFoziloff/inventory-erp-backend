import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDateString, IsMongoId, Min } from 'class-validator';
import { PriceType } from '@common/enums/price-type.enum';

export class CreateProductPriceDto {
  @IsMongoId()
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
