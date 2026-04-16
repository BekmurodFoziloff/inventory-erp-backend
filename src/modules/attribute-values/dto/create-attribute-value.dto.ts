import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';

export class CreateAttributeValueDto {
  @ToObjectId()
  @IsMongoIdObject()
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
