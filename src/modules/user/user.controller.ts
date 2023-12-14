import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  HttpException,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser } from '@modules/auth/auth.decorator';
import { TUserDocument } from './entities/user.entity';
import { ACCESS } from '@configs/permission.config';
import { IRes, IResListData } from '@configs/interface.config';
import { QueryUserDto } from './dto/query-user.dto';
import { PasswordDto } from '@modules/auth/dto/change-password.dto';
import { RemoveManyDto } from 'src/base/dto/remove-many.dto';
import { MongoIdParam } from 'src/validations/mongoId-param.pipe';

@ApiTags('user')
@Controller('v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Auth(ACCESS.CREATE_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Create user' })
  async create(@Body() body: CreateUserDto) {
    try {
      const data = await this.userService.create(body);
      if (!data?._id)
        throw new BadRequestException({ message: 'Create User Failed!' });
      return { message: 'Create User Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ UserController ~ create ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get()
  @Auth(ACCESS.LIST_USERS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get list user' })
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<IResListData<Omit<TUserDocument, never>[]>> {
    try {
      const { data, total } = await this.userService.findAll(query);
      return {
        message: 'Get List User Success!',
        data,
        total,
        limit: +query.limit,
        page: +query.page,
      };
    } catch (error) {
      Logger.error('🚀 ~ UserController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('profile')
  @Auth()
  @ApiOperation({ summary: '[USER] Get profile user' })
  async profile(@AuthUser() user: TUserDocument): Promise<IRes<TUserDocument>> {
    try {
      const data = await this.userService.findOne(user._id.toHexString());
      data.password = undefined;
      return { message: 'Get Detail User Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ UserController ~ profile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('total')
  @Auth(ACCESS.LIST_USERS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get total user in system' })
  async findTotal(): Promise<IRes<number>> {
    try {
      const data = await this.userService.findTotal();
      return { message: 'Get total user success!', data };
    } catch (error) {
      Logger.error('🚀 ~ UserController ~ findTotal ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':id')
  @Auth(ACCESS.VIEW_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail profile user' })
  async findOne(
    @Param('id', MongoIdParam) id: string,
  ): Promise<IRes<TUserDocument>> {
    try {
      const data = await this.userService.findOne(id);
      data.password = undefined;
      return { message: 'Get Detail User Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ UserController ~ profile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch(':id')
  @Auth(ACCESS.UPDATE_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update profile user by id' })
  async update(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateUserDto,
  ) {
    try {
      const result = await this.userService.update(id, body);
      if (!result)
        throw new BadRequestException({ message: 'Update User Failed!' });
      return { message: 'Update User Success!' };
    } catch (error) {
      Logger.error('🚀 ~ UserController ~ update ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch(':id/set-password')
  @Auth(ACCESS.UPDATE_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Set password user by id' })
  async setPassword(
    @Param('id', MongoIdParam) id: string,
    @Body() body: PasswordDto,
  ) {
    try {
      const result = await this.userService.adminSetPassword(
        id,
        body.newPassword,
        body.confirmPassword,
      );
      if (!result)
        throw new BadRequestException({ message: 'Set Password User Failed!' });
      return { message: 'Set Password User Success!' };
    } catch (error) {
      Logger.error('🚀 ~ UserController ~ update ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete(':id')
  @Auth(ACCESS.DELETE_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete user by id' })
  async remove(@Param('id', MongoIdParam) id: string) {
    try {
      const result = await this.userService.removeBase(id);
      if (!result)
        throw new BadRequestException({
          message: 'Delete User Failed!',
        });
      return { message: 'Delete User Success!' };
    } catch (error) {
      Logger.error('🚀 ~ UserController ~ remove ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('delete-many')
  @Auth(ACCESS.DELETE_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete user by ids' })
  async removeMany(@Body() body: RemoveManyDto) {
    try {
      const result = await this.userService.removeManyBase(body);
      if (!result)
        throw new BadRequestException({
          message: 'Delete User Failed!',
        });
      return { message: 'Delete User Success!' };
    } catch (error) {
      Logger.error('🚀 ~ UserController ~ removeMany ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
