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
import { UnitsOfMeasureService } from './units-of-measure.service';
import { CreateUomDto } from './dto/create-uom.dto';
import { UpdateUomDto } from './dto/update-uom.dto';
import { FindAllUomDto } from './dto/find-all-uom.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { UnitOfMeasure } from './unit-of-measure.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(UnitOfMeasure))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('unit-of-measures')
export class UnitsOfMeasureController {
  constructor(private readonly uomService: UnitsOfMeasureService) {}

  /** Get lightweight unit of measure list for selection dropdowns */
  @Get('lookup')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.SALES_MANAGER)
  getLookup() {
    return this.uomService.getLookup();
  }

  /** List all units of measure with basic filtering */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.VIEWER)
  findAll(@Query() params: FindAllUomDto) {
    return this.uomService.findAll(params);
  }

  /** Get detailed unit of measure information by ID */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.VIEWER)
  findById(@Param('id') id: string) {
    return this.uomService.findById(id);
  }

  /** Create a new unit of measure */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  create(@Body() createUomDto: CreateUomDto) {
    return this.uomService.create(createUomDto);
  }

  /** Update unit of measure details by ID */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  update(@Param('id') id: string, @Body() updateData: UpdateUomDto) {
    return this.uomService.update(id, updateData);
  }

  /** Quickly toggle unit of measure active status */
  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  toggleStatus(@Param('id') id: string) {
    return this.uomService.toggleStatus(id);
  }

  /** Soft delete unit of measure by ID */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.uomService.softDelete(id);
  }
}
