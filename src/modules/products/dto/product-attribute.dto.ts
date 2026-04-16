import { IsNotEmpty } from 'class-validator';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';

export class ProductAttributeDto {
  @ToObjectId()
  @IsMongoIdObject()
  @IsNotEmpty()
  attributeId: string;

  @ToObjectId()
  @IsMongoIdObject()
  @IsNotEmpty()
  valueId: string;
}

export default ProductAttributeDto;
