import { IsMongoId } from 'class-validator';

export class ParamsWithId {
  @IsMongoId()
  id: string;
}

export class ParamsWithParenttId {
  @IsMongoId()
  parentId: string;
}

export class ParamsWithProductId {
  @IsMongoId()
  productId: string;
}
