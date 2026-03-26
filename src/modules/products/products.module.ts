import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './product.schema';
import { ProductCategory, ProductCategorySchema } from '@modules/product-categories/product-category.schema';
import { Brand, BrandSchema } from '@modules/brands/brand.schema';
import { UnitOfMeasure, UnitOfMeasureSchema } from '@modules/units-of-measure/unit-of-measure.schema';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: Brand.name, schema: BrandSchema },
      { name: UnitOfMeasure.name, schema: UnitOfMeasureSchema }
    ])
  ],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}
