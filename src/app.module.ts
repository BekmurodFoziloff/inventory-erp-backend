import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { ProductCategoriesModule } from '@modules/product-categories/product-categories.module';
import { ProductsModule } from '@modules/products/products.module';

@Module({
  imports: [AppConfigModule, AuthenticationModule, ProductCategoriesModule, ProductsModule]
})
export class AppModule {}
