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
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { FindAllAttributesDto } from './dto/find-all-attributes.dto';
import { ParamsWithId } from '@common/dto/params-with-id.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { Attribute } from './attribute.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(Attribute))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  /** Get attribute dashboard statistics */
  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  getStats() {
    return this.attributesService.getStats();
  }

  /** Get lightweight list for selection dropdowns */
  @Get('lookup')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER)
  getLookup() {
    return this.attributesService.getLookup();
  }

  /** List all attributes with filters */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.VIEWER)
  findAll(@Query() params: FindAllAttributesDto) {
    return this.attributesService.findAll(params);
  }

  /** Get specific attribute details */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.VIEWER)
  findById(@Param() { id }: ParamsWithId) {
    return this.attributesService.findById(id);
  }

  /** Create new attribute dictionary */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  create(@Body() createAttributeDto: CreateAttributeDto) {
    return this.attributesService.create(createAttributeDto);
  }

  /** Update attribute details by ID */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  update(@Param() { id }: ParamsWithId, @Body() updateAttributeDto: UpdateAttributeDto) {
    return this.attributesService.update(id, updateAttributeDto);
  }

  /** Quickly switch active status */
  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  toggleStatus(@Param() { id }: ParamsWithId) {
    return this.attributesService.toggleStatus(id);
  }

  /** Soft delete attribute by ID */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param() { id }: ParamsWithId) {
    return this.attributesService.softDelete(id);
  }
}
