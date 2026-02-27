import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductCategory, ProductCategorySchema } from './product-categories.schema';
import { ProductCategoriesController } from './product-categories.controller';

import { ProductCategoriesService } from './product-categories.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ProductCategory.name, schema: ProductCategorySchema }])],
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService]
})
export class ProductCategoriesModule {}
