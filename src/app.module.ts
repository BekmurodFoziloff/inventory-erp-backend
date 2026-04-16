import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { ProductCategoriesModule } from '@modules/product-categories/product-categories.module';
import { ProductsModule } from '@modules/products/products.module';
import { BrandsModule } from '@modules/brands/brands.module';
import { UnitsOfMeasureModule } from '@modules/units-of-measure/units-of-measure.module';
import { ProductPricesModule } from '@modules/product-prices/product-prices.module';
import { CurrenciesModule } from '@modules/currencies/currencies.module';
import { AttributesModule } from '@modules/attributes/attributes.module';
import { AttributeValuesModule } from '@modules/attribute-values/attribute-values.module';

@Module({
  imports: [
    AppConfigModule,
    AuthenticationModule,
    ProductCategoriesModule,
    ProductsModule,
    BrandsModule,
    UnitsOfMeasureModule,
    ProductPricesModule,
    CurrenciesModule,
    AttributesModule,
    AttributeValuesModule
  ]
})
export class AppModule {}
