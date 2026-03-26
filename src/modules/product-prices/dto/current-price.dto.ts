import { IsOptional, IsString } from 'class-validator';

export class CurrentPriceDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export default CurrentPriceDto;
