import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Currency, CurrencySchema } from './currency.schema';
import { CurrenciesController } from './currencies.controller';
import { CurrenciesService } from './currencies.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Currency.name, schema: CurrencySchema }])],
  controllers: [CurrenciesController],
  providers: [CurrenciesService]
})
export class CurrenciesModule {}
