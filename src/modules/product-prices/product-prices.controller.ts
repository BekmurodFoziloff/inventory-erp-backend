import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductPricesService } from './product-prices.service';
import { CreateProductPriceDto } from './dto/create-price.dto';
import { UpdateProductPriceDto } from './dto/update-price.dto';
import { CurrentPriceDto } from './dto/current-price.dto';
import { ParamsWithId, ParamsWithProductId } from '@common/dto/params-with-id.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { ProductPrice } from './product-price.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(ProductPrice))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('product-prices')
export class ProductPricesController {
  constructor(private readonly pricesService: ProductPricesService) {}

  /** Get active price for a product by type */
  @Get('current')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER)
  getCurrentPrice(@Query() params: CurrentPriceDto) {
    return this.pricesService.getCurrentPrice(params);
  }

  /** Get all historical price records for a product */
  @Get('history/:productId')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  getPriceHistory(@Param() { productId }: ParamsWithProductId) {
    return this.pricesService.getPriceHistory(productId);
  }

  /** Get detailed product price information by ID */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  findById(@Param() { id }: ParamsWithId) {
    return this.pricesService.findById(id);
  }

  /** Create a new price record (syncs with product snapshot) */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  create(@Body() createPriceDto: CreateProductPriceDto) {
    return this.pricesService.create(createPriceDto);
  }

  /** Update product price details by ID */
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  update(@Param() { id }: ParamsWithId, @Body() UpdatePriceDto: UpdateProductPriceDto) {
    return this.pricesService.update(id, UpdatePriceDto);
  }
}
