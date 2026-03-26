import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Types } from 'mongoose';
import { ToObjectId } from '@common/decorators/to-object-id.decorator';
import { IsMongoIdObject } from '@common/decorators/is-mongo-id-obj.decorator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @ToObjectId()
  @IsMongoIdObject()
  parentId?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export default CreateCategoryDto;
