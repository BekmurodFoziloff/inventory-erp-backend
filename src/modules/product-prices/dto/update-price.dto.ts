import { IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateProductPriceDto {
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateProductPriceDto;
