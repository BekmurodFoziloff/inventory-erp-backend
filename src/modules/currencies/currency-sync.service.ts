import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { CurrenciesService } from './currencies.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CurrencySyncService {
  private readonly logger = new Logger(CurrencySyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly currenciesService: CurrenciesService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncRatesWithCbu() {
    this.logger.log('--- Automated Currency Sync Started ---');
    try {
      const activeCodes = await this.currenciesService.getActiveNonBaseCodes();
      this.logger.log(`Active codes from DB: ${activeCodes.join(', ')}`);

      if (activeCodes.length === 0) return;

      const todayStr = new Date().toISOString().split('T')[0];
      const url = `https://cbu.uz/uz/arkhiv-kursov-valyut/json/all/${todayStr}/`;

      const response = await firstValueFrom(this.httpService.get(url));
      const data = response.data;

      if (!Array.isArray(data)) {
        this.logger.error('CBU API did not return an array');
        return;
      }

      for (const code of activeCodes) {
        if (code === 'UZS') continue;

        const cbuItem = data.find(
          (item: any) => item.Ccy?.toString().trim().toUpperCase() === code.toString().trim().toUpperCase()
        );

        if (cbuItem) {
          const rate = parseFloat(cbuItem.Rate);
          this.logger.log(`Found rate for ${code}: ${rate}`);
          await this.currenciesService.updateRate(code, rate, new Date());
        } else {
          this.logger.warn(`Could not find ${code} in CBU data. Sample Ccy from API: ${data[0]?.Ccy}`);
        }
      }
      this.logger.log('--- Sync Completed ---');
    } catch (error) {
      this.logger.error(`CBU Sync Failed: ${error.message}`);
    }
  }
}
