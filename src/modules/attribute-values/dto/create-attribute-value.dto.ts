import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsBoolean } from 'class-validator';

export class CreateAttributeValueDto {
  @IsMongoId()
  @IsNotEmpty()
  attributeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default CreateAttributeValueDto;
