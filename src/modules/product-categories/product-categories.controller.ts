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
  UseInterceptors,
  UseGuards
} from '@nestjs/common';
import { ProductCategoriesService } from './product-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FindAllCategoriesDto } from './dto/find-all-categories.dto';
import { ProductCategoryTreeDto } from './dto/category-tree.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { ProductCategory } from './product-category.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SerializeTo } from '@common/decorators/serialize-to.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(ProductCategory))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly categoryService: ProductCategoriesService) {}

  /** Get category dashboard statistics */
  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  getStats() {
    return this.categoryService.getStats();
  }

  /** Get hierarchical tree structure of categories */
  @Get('tree')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  @SerializeTo(ProductCategoryTreeDto)
  getTree() {
    return this.categoryService.getTree();
  }

  /** Get lightweight category list for selection dropdowns */
  @Get('lookup')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  getLookup() {
    return this.categoryService.getLookup();
  }

  /** Mass update category active status */
  @Patch('bulk-status')
  @Roles(Role.SUPER_ADMIN)
  bulkUpdateStatus(@Body() body: { ids: string[]; isActive: boolean }) {
    return this.categoryService.bulkToggleStatus(body.ids, body.isActive);
  }

  /** Get full path (breadcrumbs) for a specific category */
  @Get(':id/ancestors')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  getAncestors(@Param('id') id: string) {
    return this.categoryService.getAncestors(id);
  }

  /** Get paginated, filtered, and searchable category list */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  findAll(@Query() params: FindAllCategoriesDto) {
    return this.categoryService.findAll(params);
  }

  /** Get detailed category information by ID */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER, Role.VIEWER)
  findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  /** Create a new category */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  create(@Body() categoryData: CreateCategoryDto) {
    return this.categoryService.create(categoryData);
  }

  /** Update category details by ID */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  update(@Param('id') id: string, @Body() categoryData: UpdateCategoryDto) {
    return this.categoryService.update(id, categoryData);
  }

  /** Quickly toggle category active status */
  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  toggleStatus(@Param('id') id: string) {
    return this.categoryService.toggleStatus(id);
  }

  /** Soft delete category by ID */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.categoryService.softDelete(id);
  }
}
