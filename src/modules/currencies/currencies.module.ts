import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Currency, CurrencySchema } from './schemas/currency.schema';
import { ExchangeRateHistory, ExchangeRateHistorySchema } from './schemas/exchange-rate-history.schema';
import { CurrenciesController } from './currencies.controller';
import { CurrenciesService } from './currencies.service';
import { CurrencySyncService } from './currency-sync.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Currency.name, schema: CurrencySchema },
      { name: ExchangeRateHistory.name, schema: ExchangeRateHistorySchema }
    ]),
    HttpModule
  ],
  controllers: [CurrenciesController],
  providers: [CurrenciesService, CurrencySyncService],
  exports: [CurrenciesService]
})
export class CurrenciesModule {}
