import { Controller, Get, Post, Body, Put, Patch, Param, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
import { AttributeValuesService } from './attribute-values.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { AttributeValue } from './attribute-value.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(AttributeValue))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('attribute-values')
export class AttributeValuesController {
  constructor(private readonly attributeValuesService: AttributeValuesService) {}

  /** Get all values for a specific attribute (e.g., all colors) */
  @Get('by-attribute/:attributeId')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.VIEWER)
  findByAttribute(@Param('attributeId') attributeId: string) {
    return this.attributeValuesService.findByAttribute(attributeId);
  }

  /** Create a new value for a specific attribute */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  create(@Body() createValueDto: CreateAttributeValueDto) {
    return this.attributeValuesService.create(createValueDto);
  }

  /** Update attribute value details by ID */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  update(@Param('id') id: string, @Body() updateValueDto: UpdateAttributeValueDto) {
    return this.attributeValuesService.update(id, updateValueDto);
  }

  /** Toggle active status */
  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  toggleStatus(@Param('id') id: string) {
    return this.attributeValuesService.toggleStatus(id);
  }

  /** Soft delete attribute value */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.attributeValuesService.softDelete(id);
  }
}
