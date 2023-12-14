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
import { ShowtimeService } from './showtime.service';
import {
  BookingShowtimeDto,
  CreateShowtimeDto,
} from './dto/create-showtime.dto';
import { TShowtimeDocument } from './entities/showtime.entity';
import {
  QueryClientShowtimeDto,
  QueryShowtimeDto,
} from './dto/query-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

@ApiTags('showtime')
@Controller('v1/showtime')
export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  @Post()
  @Auth(ACCESS.CREATE_SHOWTIME)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Create Showtime' })
  async create(
    @Body() body: CreateShowtimeDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TShowtimeDocument>> {
    try {
      const data = await this.showtimeService.create(body, user);
      if (!data?._id)
        throw new BadRequestException({ message: 'Create Showtime Failed!' });
      return { message: 'Create Showtime Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ ShowtimeController ~ create ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get()
  @Auth(ACCESS.LIST_SHOWTIME)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get List Showtime' })
  async findAll(
    @Query() query: QueryShowtimeDto,
  ): Promise<IRes<TShowtimeDocument[]>> {
    try {
      const { data, total } = await this.showtimeService.findAll(query, true);
      return {
        message: 'Get List Showtime Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ ShowtimeController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('client')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Get List Showtime' })
  async clientFindAll(
    @Query() query: QueryClientShowtimeDto,
  ): Promise<IRes<TShowtimeDocument[]>> {
    try {
      const { data, total } = await this.showtimeService.findAll(query, false);
      return {
        message: 'Get List Showtime Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ ShowtimeController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':id')
  @Auth(ACCESS.VIEW_SHOWTIME)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail Showtime by id' })
  async findOne(
    @Param('id', MongoIdParam) id: string,
  ): Promise<IRes<TShowtimeDocument>> {
    try {
      const data = await this.showtimeService.findOne(id);
      if (!data)
        throw new NotFoundException({ message: 'Showtime not found!' });
      return { message: 'Get detail Showtime success!', data };
    } catch (error) {
      Logger.error('🚀 ~ ShowtimeController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':id/client')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Get detail Showtime by id' })
  async clientFindOne(
    @Param('id', MongoIdParam) id: string,
  ): Promise<IRes<TShowtimeDocument>> {
    try {
      const data = await this.showtimeService.findOne(id, false);
      if (!data)
        throw new NotFoundException({ message: 'Showtime not found!' });
      return { message: 'Get detail Showtime success!', data };
    } catch (error) {
      Logger.error('🚀 ~ ShowtimeController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch(':id')
  @Auth(ACCESS.UPDATE_SHOWTIME)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update Showtime by id' })
  async update(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateShowtimeDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes> {
    try {
      const result = await this.showtimeService.update(id, body, user);
      if (!result)
        throw new BadRequestException({ message: 'Update Showtime failed!' });
      return { message: 'Update Showtime success!' };
    } catch (error) {
      Logger.error('🚀 ~ ShowtimeController ~ update ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete(':id')
  @Auth(ACCESS.DELETE_SHOWTIME)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Showtime by id' })
  async remove(@Param('id', MongoIdParam) id: string): Promise<IRes> {
    try {
      const result = await this.showtimeService.removeBase(id);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Showtime Failed!',
        });
      return { message: 'Delete Showtime Success!' };
    } catch (error) {
      Logger.error('🚀 ~ ShowtimeController ~ remove ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('delete-many')
  @Auth(ACCESS.DELETE_SHOWTIME)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Showtime by ids' })
  async removeMany(@Body() body: RemoveManyDto): Promise<IRes> {
    try {
      const result = await this.showtimeService.removeManyBase(body);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Showtime Failed!',
        });
      return { message: 'Delete Showtime Success!' };
    } catch (error) {
      Logger.error('🚀 ~ ShowtimeController ~ removeMany ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('booking')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Booking Showtime' })
  async booking(
    @Body() body: BookingShowtimeDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes> {
    try {
      const result = await this.showtimeService.bookingShowtime(body, user);
      if (!result)
        throw new BadRequestException({
          message: 'Booking Showtime Failed!',
        });
      return { message: 'Booking Showtime Success!' };
    } catch (error) {
      Logger.error('🚀 ~ ShowtimeController ~ removeMany ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
