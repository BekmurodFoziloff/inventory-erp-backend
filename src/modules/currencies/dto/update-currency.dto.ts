import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, MaxLength } from 'class-validator';

export class UpdateCurrencyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsNumber()
  @Min(0.000001)
  exchangeRate: number;

  @IsOptional()
  @IsBoolean()
  isBase?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateCurrencyDto;
