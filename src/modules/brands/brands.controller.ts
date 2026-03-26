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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FindAllBrandsDto } from './dto/find-all-brands.dto';
import { ParamsWithId } from '@common/dto/params-with-id.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { Brand } from './brand.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(Brand))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  /** Get lightweight brand list for selection dropdowns */
  @Get('lookup')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER)
  getLookup() {
    return this.brandsService.getLookup();
  }

  /** Get paginated, filtered, and searchable brand list */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.VIEWER)
  findAll(@Query() params: FindAllBrandsDto) {
    return this.brandsService.findAll(params);
  }

  /** Get detailed brand information by ID */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.VIEWER)
  findById(@Param() { id }: ParamsWithId) {
    return this.brandsService.findById(id);
  }

  /** Create a new brand */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  /** Update brand details by ID */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  update(@Param() { id }: ParamsWithId, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  /** Quickly toggle brand active status */
  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  toggleStatus(@Param() { id }: ParamsWithId) {
    return this.brandsService.toggleStatus(id);
  }

  /** Soft delete brand by ID */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param() { id }: ParamsWithId) {
    return this.brandsService.softDelete(id);
  }
}
