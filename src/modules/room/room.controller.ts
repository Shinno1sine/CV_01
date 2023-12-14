import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser } from '@modules/auth/auth.decorator';
import { ACCESS } from '@configs/permission.config';
import { TUserDocument } from '@modules/user/entities/user.entity';
import { MongoIdParam } from 'src/validations/mongoId-param.pipe';
import { IRes } from '@configs/interface.config';
import { RemoveManyDto } from '@src/base/dto/remove-many.dto';
import { RoomService } from './room.service';
import { CreateLayoutDto, CreateRoomDto } from './dto/create-room.dto';
import { TRoomDocument } from './entities/room.entity';
import { QueryLayoutDto, QueryRoomDto } from './dto/query-room.dto';
import {
  UpdateLayoutDto,
  UpdateRoomDto,
  UpdateSeatDto,
} from './dto/update-room.dto';
import { TLayoutDocument } from './entities/layout.entity';

@ApiTags('room')
@Controller('v1/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /** ROOM===============================ROOM */
  @Post()
  @Auth(ACCESS.CREATE_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Create Room' })
  async createRoom(
    @Body() body: CreateRoomDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TRoomDocument>> {
    try {
      const data = await this.roomService.createRoom(body, user);
      if (!data?._id)
        throw new BadRequestException({ message: 'Create Room Failed!' });
      return { message: 'Create Room Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ RoomController ~ create ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get()
  @Auth(ACCESS.LIST_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get List Room' })
  async findAllRoom(
    @Query() query: QueryRoomDto,
  ): Promise<IRes<TRoomDocument[]>> {
    try {
      const { data, total } = await this.roomService.findAllRoom(query);
      return {
        message: 'Get List Room Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ RoomController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':id')
  @Auth(ACCESS.VIEW_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail Room by id' })
  async findOneRoom(
    @Param('id', MongoIdParam) id: string,
  ): Promise<IRes<TRoomDocument>> {
    try {
      const data = await this.roomService.findOneRoom(id);
      if (!data) throw new NotFoundException({ message: 'Room not found!' });
      return { message: 'Get detail Room success!', data };
    } catch (error) {
      Logger.error('🚀 ~ RoomController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch(':id')
  @Auth(ACCESS.UPDATE_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update Room by id' })
  async updateRoom(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateRoomDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes> {
    try {
      const result = await this.roomService.updateRoom(id, body, user);
      if (!result)
        throw new BadRequestException({ message: 'Update Room failed!' });
      return { message: 'Update Room success!' };
    } catch (error) {
      Logger.error('🚀 ~ RoomController ~ update ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete(':id')
  @Auth(ACCESS.DELETE_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Room by id' })
  async removeRoom(@Param('id', MongoIdParam) id: string): Promise<IRes> {
    try {
      const result = await this.roomService.removeBase(id);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Room Failed!',
        });
      return { message: 'Delete Room Success!' };
    } catch (error) {
      Logger.error('🚀 ~ RoomController ~ remove ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('delete-many')
  @Auth(ACCESS.DELETE_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Room by ids' })
  async removeManyRoom(@Body() body: RemoveManyDto): Promise<IRes> {
    try {
      const result = await this.roomService.removeManyBase(body);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Room Failed!',
        });
      return { message: 'Delete Room Success!' };
    } catch (error) {
      Logger.error('🚀 ~ RoomController ~ removeMany ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  /** LAYOUT===============================LAYOUT */
  @Post('layout')
  @Auth(ACCESS.CREATE_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Create Layout' })
  async createLayout(
    @Body() body: CreateLayoutDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TLayoutDocument>> {
    try {
      const data = await this.roomService.createLayout(body, user);
      if (!data?._id)
        throw new BadRequestException({ message: 'Create Room Failed!' });
      return { message: 'Create Layout Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ RoomController ~ create ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('layout')
  @Auth(ACCESS.LIST_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get List Layout' })
  async findAllLayout(
    @Query() query: QueryLayoutDto,
  ): Promise<IRes<TLayoutDocument[]>> {
    try {
      const { data, total } = await this.roomService.findAllLayout(query);
      return {
        message: 'Get List Layout Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ RoomController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('layout/:id')
  @Auth(ACCESS.VIEW_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail Layout by id' })
  async findOneLayout(
    @Param('id', MongoIdParam) id: string,
  ): Promise<IRes<TLayoutDocument>> {
    try {
      const data = await this.roomService.findOneLayout(id);
      if (!data) throw new NotFoundException({ message: 'Layout not found!' });
      return { message: 'Get detail Layout success!', data };
    } catch (error) {
      Logger.error('🚀 ~ LayoutController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch('layout/:id')
  @Auth(ACCESS.UPDATE_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update Layout by id' })
  async updateLayout(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateLayoutDto,
  ): Promise<IRes> {
    try {
      const result = await this.roomService.updateLayout(id, body);
      if (!result)
        throw new BadRequestException({ message: 'Update Layout failed!' });
      return { message: 'Update Layout success!' };
    } catch (error) {
      Logger.error('🚀 ~ LayoutController ~ update ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete('layout/:id')
  @Auth(ACCESS.DELETE_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Layout by id' })
  async removeLayout(@Param('id', MongoIdParam) id: string): Promise<IRes> {
    try {
      const result = await this.roomService.removeLayout(id);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Layout Failed!',
        });
      return { message: 'Delete Layout Success!' };
    } catch (error) {
      Logger.error('🚀 ~ LayoutController ~ remove ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  /** SEAT==================================SEAT */
  @Patch('seat/:id')
  @Auth(ACCESS.UPDATE_ROOM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update Seat by id' })
  async updateSeat(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateSeatDto,
  ): Promise<IRes> {
    try {
      const result = await this.roomService.updateSeat(id, body);
      if (!result)
        throw new BadRequestException({ message: 'Update Seat failed!' });
      return { message: 'Update Seat success!' };
    } catch (error) {
      Logger.error('🚀 ~ SeatController ~ update ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
