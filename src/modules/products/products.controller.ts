import { Controller, Post, Body, Get, Put, Param, Delete, UseInterceptors, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { Product } from './products.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(Product))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Post(':parentId/variants')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  createVariant(@Param('parentId') parentId: string, @Body() dto: CreateProductDto) {
    return this.productsService.createVariantProduct(parentId, dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  findAll() {
    return this.productsService.findAllActiveProducts();
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.softDeleteProduct(id);
  }
}
