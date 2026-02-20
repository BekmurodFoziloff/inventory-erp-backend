import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsDateString,
  IsMongoId
} from 'class-validator';
import { Type } from 'class-transformer';

class ReceiptLineDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  lotCode?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialNumbers?: string[];
}

export class CreatePurchaseReceiptDto {
  @IsMongoId()
  supplierId: string;

  @IsMongoId()
  warehouseId: string;

  @IsDateString()
  receiptDate: Date;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptLineDto)
  lines: ReceiptLineDto[];

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class CancelReceiptDto {
  @IsString()
  @IsNotEmpty({ message: 'A reason must be provided when cancelling a receipt' })
  reason: string;
}