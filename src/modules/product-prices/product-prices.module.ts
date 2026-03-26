import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductPrice, ProductPriceSchema } from './product-price.schema';
import { Product, ProductSchema } from '@modules/products/product.schema';
import { ProductPricesController } from './product-prices.controller';
import { ProductPricesService } from './product-prices.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductPrice.name, schema: ProductPriceSchema },
      { name: Product.name, schema: ProductSchema }
    ])
  ],
  controllers: [ProductPricesController],
  providers: [ProductPricesService]
})
export class ProductPricesModule {}
