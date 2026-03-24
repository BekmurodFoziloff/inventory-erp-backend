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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import MongooseClassSerializerInterceptor from '@common/utils/mongoose-class-serializer.interceptor';
import { User } from './user.schema';
import JwtAuthenticationGuard from '@modules/authentication/guards/jwt-authentication.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import Role from '@common/enums/role.enum';

@UseInterceptors(MongooseClassSerializerInterceptor(User))
@UseGuards(JwtAuthenticationGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Get paginated, filtered, and searchable user list */
  @Get()
  @Roles(Role.SUPER_ADMIN)
  async findAll(@Query() params?: FindAllUsersDto) {
    return this.usersService.findAll(params);
  }

  /** Get detailed user information by ID */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /** Internal route to create new ERP staff members */
  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() userData: CreateUserDto) {
    return this.usersService.create(userData);
  }

  /** Update user profile or ERP role */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
    return this.usersService.update(id, updateData);
  }

  /** Quickly switch user active status */
  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN)
  async toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }

  /** Reset or change user password by Administrator */
  @Patch(':id/change-password')
  @Roles(Role.SUPER_ADMIN)
  async changePassword(@Param('id') id: string, @Body() passwordData: ChangePasswordDto) {
    return this.usersService.changePassword(id, passwordData.password);
  }

  /** Soft delete user to maintain audit history */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
