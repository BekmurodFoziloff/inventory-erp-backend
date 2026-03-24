import { Expose, Type } from 'class-transformer';
import { ProductCategory } from '../product-category.schema';

export class ProductCategoryTreeDto extends ProductCategory {
  @Expose()
  @Type(() => ProductCategoryTreeDto)
  children?: ProductCategoryTreeDto[];
}

export default ProductCategoryTreeDto;
