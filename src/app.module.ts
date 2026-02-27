import { Module } from '@nestjs/common';
import { AppConfigModule } from '@core/config/config.module';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { ProductsModule } from '@modules/products/products.module';
import { ProductCategoriesModule } from '@modules/product-categories/product-categories.module';

@Module({
  imports: [AppConfigModule, AuthenticationModule, ProductCategoriesModule, ProductsModule]
})
export class AppModule {}
