import { IsArray, IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class BulkUpdateStatusDto {
  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];

  @IsBoolean()
  isActive: boolean;
}
