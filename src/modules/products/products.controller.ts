import { Controller, Post, Body, Get, Put, Param, Delete, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { Product } from './products.schema';

@UseInterceptors(MongooseClassSerializerInterceptor(Product))
@Controller('products')
export class ProductController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Post(':parentId/variants')
  createVariant(@Param('parentId') parentId: string, @Body() dto: CreateProductDto) {
    return this.productsService.createVariantProduct(parentId, dto);
  }

  @Get()
  findAll() {
    return this.productsService.findAllActiveProducts();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.softDeleteProduct(id);
  }
}
