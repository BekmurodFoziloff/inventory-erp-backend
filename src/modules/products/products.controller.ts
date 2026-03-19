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

  /** Get dashboard statistics */
  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  getDashboardStats() {
    return this.productsService.getDashboardStats();
  }

  /** Get lightweight parent list for dropdowns */
  @Get('parents/lookup')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  getParentLookup() {
    return this.productsService.getParentLookup();
  }

  /** Mass update product activity status */
  @Patch('bulk-status')
  @Roles(Role.SUPER_ADMIN)
  bulkToggleStatus(@Body() body: { ids: string[]; isActive: boolean }) {
    return this.productsService.bulkToggleStatus(body.ids, body.isActive);
  }

  /** List products with pagination and filters */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  findAll(@Query() params: FindAllProductsDto) {
    return this.productsService.findAll(params);
  }

  /** Get detailed product by ID */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  /** Create a new product or template */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  create(@Body() productData: CreateProductDto) {
    return this.productsService.create(productData);
  }

  /** Create a product variant linked to a parent */
  @Post(':parentId/variants')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  createVariant(@Param('parentId') parentId: string, @Body() productData: CreateProductDto) {
    return this.productsService.createVariant(parentId, productData);
  }

  /** Update product details by ID */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  update(@Param('id') id: string, @Body() productData: UpdateProductDto) {
    return this.productsService.update(id, productData);
  }

  /** Quickly switch product active state */
  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  toggleStatus(@Param('id') id: string) {
    return this.productsService.toggleStatus(id);
  }

  /** Soft delete a product by ID */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }
}
