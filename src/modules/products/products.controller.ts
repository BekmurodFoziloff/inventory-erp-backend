import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UseGuards
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { BulkUpdateStatusDto } from '@common/dto/bulk-update-status.dto';
import { ParamsWithId, ParamsWithParenttId } from '@common/dto/params-with-id.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { Product } from './product.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(Product))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** Get product dashboard statistics */
  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  getDashboardStats() {
    return this.productsService.getDashboardStats();
  }

  /** Get lightweight parent product list for dropdowns */
  @Get('parents/lookup')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  getParentLookup() {
    return this.productsService.getParentLookup();
  }

  /** Mass update product active status */
  @Patch('bulk-status')
  @Roles(Role.SUPER_ADMIN)
  bulkToggleStatus(@Body() bulkUpdateStatus: BulkUpdateStatusDto) {
    return this.productsService.bulkToggleStatus(bulkUpdateStatus);
  }

  /** Get paginated, filtered, and searchable product list */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  findAll(@Query() params: FindAllProductsDto) {
    return this.productsService.findAll(params);
  }

  /** Get detailed product information by ID */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  findById(@Param() { id }: ParamsWithId) {
    return this.productsService.findById(id);
  }

  /** Create a new product or variant template */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /** Create a product variant linked to a parent template */
  @Post(':parentId/variants')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  createVariant(@Param() { parentId }: ParamsWithParenttId, @Body() createVariantDto: CreateProductDto) {
    return this.productsService.createVariant(parentId, createVariantDto);
  }

  /** Update product details by ID */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  update(@Param() { id }: ParamsWithId, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  /** Quickly toggle product active status */
  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  toggleStatus(@Param() { id }: ParamsWithId) {
    return this.productsService.toggleStatus(id);
  }

  /** Soft delete product by ID */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param() { id }: ParamsWithId) {
    return this.productsService.softDelete(id);
  }
}
