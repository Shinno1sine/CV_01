import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  HttpException,
  NotFoundException,
  Query,
  Logger,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IRes, IResListData } from '@configs/interface.config';
import { TRoleDocument } from './entities/role.entity';
import { QueryRoleDto } from './dto/query-role.dto';
import { Auth, AuthUser } from '@modules/auth/auth.decorator';
import { ACCESS, permissions } from '@configs/permission.config';
import { RemoveManyDto } from 'src/base/dto/remove-many.dto';
import { TUserDocument } from '@modules/user/entities/user.entity';
import { MongoIdParam } from 'src/validations/mongoId-param.pipe';

@ApiTags('role')
@Controller('v1/role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Auth(ACCESS.CREATE_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Create role' })
  async create(@Body() body: CreateRoleDto): Promise<IRes<TRoleDocument>> {
    try {
      const data = await this.roleService.create(body);
      if (!data?._id)
        throw new BadRequestException({ message: 'Create Role Failed!' });
      return { message: 'Create Role Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ RoleController ~ create ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Auth(ACCESS.LIST_ROLES)
  @ApiOperation({ summary: '[ADMIN] Get list role' })
  async findAll(
    @Query() query: QueryRoleDto,
  ): Promise<IResListData<Omit<TRoleDocument, never>[]>> {
    try {
      const { data, total } = await this.roleService.findAll(query);
      return {
        data,
        total,
        message: 'Get List Role Success!',
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ RoleController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('permission')
  @Auth(ACCESS.LIST_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get list permission' })
  async findAllPermission() {
    try {
      return { message: 'Get list permission success!', data: permissions };
    } catch (error) {
      Logger.error('🚀 ~ findCurrentRole ~ findAllPermission ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('current')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Get a list of your current roles' })
  async findCurrentRole(
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TRoleDocument[]>> {
    try {
      const roleIds = user.roles.map((role: TRoleDocument) =>
        role._id.toHexString(),
      );
      if (roleIds?.length <= 0)
        return { message: 'Get current roles success!', data: [] };
      const data = await this.roleService.findAllInIds(roleIds);
      return { message: 'Get current roles success!', data };
    } catch (error) {
      Logger.error('🚀 ~ RoleController ~ findCurrentRole ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('total')
  @Auth(ACCESS.LIST_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get total role in system' })
  async findTotal(): Promise<IRes<number>> {
    try {
      const data = await this.roleService.findTotal();
      return { message: 'Get total role success!', data };
    } catch (error) {
      Logger.error('🚀 ~ RoleController ~ findTotal ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':id')
  @Auth(ACCESS.VIEW_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail role by id' })
  async findOne(
    @Param('id', MongoIdParam) id: string,
  ): Promise<IRes<TRoleDocument>> {
    try {
      const data = await this.roleService.findOne(id);
      if (!data) throw new NotFoundException();
      return { message: 'Get Detail Role Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ RoleController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch(':id')
  @Auth(ACCESS.UPDATE_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update role by code' })
  async update(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateRoleDto,
  ): Promise<IRes> {
    try {
      const result = await this.roleService.update(id, body);
      if (!result)
        throw new NotImplementedException({ message: 'Update Role Failed!' });
      return { message: 'Update Role Success!' };
    } catch (error) {
      Logger.error('🚀 ~ RoleController ~ update ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete(':id')
  @Auth(ACCESS.DELETE_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete role by id' })
  async remove(@Param('id', MongoIdParam) id: string): Promise<IRes> {
    try {
      const result = await this.roleService.removeBase(id);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Role Failed!',
        });
      return { message: 'Delete Role Success!' };
    } catch (error) {
      Logger.error('🚀 ~ RoleController ~ remove ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('delete-many')
  @Auth(ACCESS.DELETE_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete role by ids' })
  async removeMany(@Body() body: RemoveManyDto): Promise<IRes> {
    try {
      const result = await this.roleService.removeManyBase(body);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Role Failed!',
        });
      return { message: 'Delete Role Success!' };
    } catch (error) {
      Logger.error('🚀 ~ RoleController ~ removeMany ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
