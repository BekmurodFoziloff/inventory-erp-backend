import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { FindAllCurrenciesDto } from './dto/find-all-currencies.dto';
import { ParamsWithId } from '@common/dto/params-with-id.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { Currency } from './schemas/currency.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(Currency))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  /** Get lightweight currency list for selection dropdowns */
  @Get('lookup')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  getLookup() {
    return this.currenciesService.getLookup();
  }

  /** List all currencies with filtering */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.VIEWER)
  findAll(@Query() params: FindAllCurrenciesDto) {
    return this.currenciesService.findAll(params);
  }

  /** Get detailed currency information by ID */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  findById(@Param() { id }: ParamsWithId) {
    return this.currenciesService.findById(id);
  }

  /** Get historical exchange rates for a specific currency */
  @Get(':id/history')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.VIEWER)
  async getHistory(@Param() { id }: ParamsWithId) {
    return this.currenciesService.getHistory(id);
  }

  /** Create a new currency */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  create(@Body() createCurrencyDto: CreateCurrencyDto) {
    return this.currenciesService.create(createCurrencyDto);
  }

  /** Update currency details by ID */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  update(@Param() { id }: ParamsWithId, @Body() updateCurrencyDto: UpdateCurrencyDto) {
    return this.currenciesService.update(id, updateCurrencyDto);
  }

  /** Quickly switch currency active status */
  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  toggleStatus(@Param() { id }: ParamsWithId) {
    return this.currenciesService.toggleStatus(id);
  }

  /** Soft delete a currency */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param() { id }: ParamsWithId) {
    return this.currenciesService.softDelete(id);
  }
}
