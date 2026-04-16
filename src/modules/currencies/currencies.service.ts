import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Currency, CurrencyDocument } from './schemas/currency.schema';
import { ExchangeRateHistory, ExchangeRateHistoryDocument } from './schemas/exchange-rate-history.schema';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { FindAllCurrenciesDto } from './dto/find-all-currencies.dto';

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectModel(Currency.name) private currencyModel: Model<CurrencyDocument>,
    @InjectModel(ExchangeRateHistory.name) private historyModel: Model<ExchangeRateHistoryDocument>,
    @InjectConnection() private readonly connection: Connection
  ) {}

  private readonly defaultPopulate = [{ path: 'currencyId', select: 'code name' }];

  /** Get all active currencies for dropdowns */
  async getLookup(): Promise<Currency[]> {
    return this.currencyModel
      .find({ deletedAt: null, isActive: true }, 'code name symbol')
      .sort({ code: 1 })
      .lean()
      .exec() as any;
  }

  /** List all currencies with filtering */
  async findAll(params: FindAllCurrenciesDto) {
    const filter: any = { deletedAt: null };
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { code: { $regex: params.search, $options: 'i' } }
      ];
    }
    if (params.isActive !== undefined) filter.isActive = params.isActive;

    const data = await this.currencyModel.find(filter).sort({ isBase: -1, code: 1 }).lean().exec();
    return data as any as Currency[];
  }

  /** Find specific currency by ID */
  async findById(id: string): Promise<Currency> {
    const currency = await this.currencyModel.findOne({ _id: id, deletedAt: null }).lean().exec();
    if (!currency) throw new NotFoundException(`Currency with ID "${id}" not found`);
    return currency as any as Currency;
  }

  /** Get last 30 historical rates for a specific currency */
  async getHistory(id: string): Promise<ExchangeRateHistory[]> {
    const history = await this.historyModel
      .find({ currencyId: id })
      //.sort({ date: -1 })
      //.limit(30)
      //.populate(this.defaultPopulate)
      .lean()
      .exec();

    return history as any as ExchangeRateHistory[];
  }

  /** Create new currency and handle base currency logic */
  async create(createCurrencyDto: CreateCurrencyDto): Promise<Currency> {
    try {
      if (createCurrencyDto.isBase) {
        await this.currencyModel.updateMany({}, { isBase: false }).exec();
        createCurrencyDto.exchangeRate = 1; // Base currency is always 1
      }

      const currency = new this.currencyModel(createCurrencyDto);
      const saved = await currency.save();
      return saved.toObject() as any as Currency;
    } catch (error) {
      throw error;
    }
  }

  /** Update currency and ensure base currency rules */
  async update(id: string, updateCurrencyDto: UpdateCurrencyDto): Promise<Currency> {
    if (updateCurrencyDto.isBase) {
      await this.currencyModel.updateMany({ _id: { $ne: id } }, { isBase: false }).exec();
      updateCurrencyDto.exchangeRate = 1;
    }

    const currency = await this.currencyModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: updateCurrencyDto },
        { returnDocument: 'after', runValidators: true, lean: true }
      )
      .exec();

    if (!currency) throw new NotFoundException(`Currency with ID "${id}" not found`);
    return currency as any as Currency;
  }

  /** Quickly switch active status */
  async toggleStatus(id: string): Promise<Currency> {
    const currency = await this.currencyModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, [{ $set: { isActive: { $not: '$isActive' } } }], {
        returnDocument: 'after',
        lean: true,
        updatePipeline: true
      } as any)
      .exec();

    if (!currency) throw new NotFoundException(`Currency with ID "${id}" not found`);
    return currency as any as Currency;
  }

  /** Soft delete if not used in transactions */
  async softDelete(id: string): Promise<Currency> {
    const currency = await this.currencyModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!currency) throw new NotFoundException(`Currency with ID "${id}" not found`);

    if (currency.isBase) throw new BadRequestException('Cannot delete the base currency');

    if (currency.isUsed) {
      currency.isActive = false;
      const saved = await currency.save();
      return saved.toObject() as any as Currency;
    }

    const deleted = await this.currencyModel
      .findOneAndUpdate(
        { _id: id },
        { $set: { deletedAt: new Date(), isActive: false } },
        { returnDocument: 'after', lean: true }
      )
      .exec();
    return deleted as any as Currency;
  }

  /**
   * Updates the current rate AND saves it to history.
   * Uses a transaction to ensure both records are updated.
   */
  async updateRate(code: string, rate: number, date: Date = new Date()): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const currency = await this.currencyModel.findOne({ code: code.toUpperCase() }).session(session);
      if (!currency) return;

      currency.exchangeRate = rate;
      await currency.save({ session });

      const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));

      await this.historyModel.findOneAndUpdate(
        { currencyId: currency._id, date: startOfDay },
        { rate, source: 'CBU_API' },
        { upsert: true, session }
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /** Get only active, non-base currency codes from the database */
  async getActiveNonBaseCodes(): Promise<string[]> {
    const currencies = await this.currencyModel
      .find(
        {
          isBase: false,
          isActive: true,
          deletedAt: null
        },
        { code: 1 }
      )
      .lean()
      .exec();

    return currencies.map((c) => c.code.toUpperCase());
  }

  /** Get specific rate for a specific date (Crucial for Reporting) */
  async getRateForDate(currencyId: string, targetDate: Date): Promise<number> {
    const history = await this.historyModel
      .findOne({
        currencyId,
        date: { $lte: targetDate }
      })
      .sort({ date: -1 })
      .lean()
      .exec();

    return history ? history.rate : 1;
  }
}
