import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';

export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @ToObjectId()
  @IsMongoIdObject()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default UpdateCategoryDto;
