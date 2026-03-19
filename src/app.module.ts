import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { ProductCategoriesModule } from '@modules/product-categories/product-categories.module';

@Module({
  imports: [AppConfigModule, AuthenticationModule, ProductCategoriesModule]
})
export class AppModule {}
