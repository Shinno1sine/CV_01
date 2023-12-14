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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { TOrderDocument } from './entities/order.entity';
import { QueryMyOrderDto, QueryOrderDto } from './dto/query-order.dto';
import { ApproveOrderDto } from './dto/update-order.dto';
@ApiTags('order')
@Controller('v1/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Create order' })
  async create(
    @Body() body: CreateOrderDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TOrderDocument>> {
    try {
      const data = await this.orderService.create(body, user);
      if (!data?._id)
        throw new BadRequestException({ message: 'Create Order Failed!' });
      return { message: 'Create Order Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ OrderController ~ create ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get()
  @Auth(ACCESS.LIST_ORDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get List Order' })
  async findAll(
    @Query() query: QueryOrderDto,
  ): Promise<IRes<TOrderDocument[]>> {
    try {
      const { data, total } = await this.orderService.findAll(query);
      return {
        message: 'Get List Order Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ OrderController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('/my-order')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Get List My Order' })
  async findAllMyOrder(
    @Query() query: QueryMyOrderDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TOrderDocument[]>> {
    try {
      const { data, total } = await this.orderService.findAllMyOrder(
        user,
        query,
      );
      return {
        message: 'Get List Order Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ OrderController ~ findAllMyOrder ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':id')
  @Auth(ACCESS.VIEW_ORDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail Order by id' })
  async findOne(
    @Param('id', MongoIdParam) id: string,
  ): Promise<IRes<TOrderDocument>> {
    try {
      const data = await this.orderService.findOne(id);
      if (!data) throw new NotFoundException({ message: 'Order not found!' });
      return { message: 'Get detail Order success!', data };
    } catch (error) {
      Logger.error('🚀 ~ OrderController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch(':id/approve')
  @Auth(ACCESS.UPDATE_ORDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Approve Order by id' })
  async approve(
    @Param('id', MongoIdParam) id: string,
    @Body() body: ApproveOrderDto,
  ): Promise<IRes<TOrderDocument>> {
    try {
      const result = await this.orderService.approve(id, body);
      if (!result)
        throw new NotFoundException({ message: 'Update Order failed!' });
      return { message: 'Update Order success!', result };
    } catch (error) {
      Logger.error('🚀 ~ OrderController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete(':id')
  @Auth(ACCESS.DELETE_ORDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Order by id' })
  async remove(@Param('id', MongoIdParam) id: string): Promise<IRes> {
    try {
      const result = await this.orderService.removeBase(id);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Order Failed!',
        });
      return { message: 'Delete Order Success!' };
    } catch (error) {
      Logger.error('🚀 ~ OrderController ~ remove ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('delete-many')
  @Auth(ACCESS.DELETE_ORDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Order by ids' })
  async removeMany(@Body() body: RemoveManyDto): Promise<IRes> {
    try {
      const result = await this.orderService.removeManyBase(body);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Order Failed!',
        });
      return { message: 'Delete Order Success!' };
    } catch (error) {
      Logger.error('🚀 ~ OrderController ~ removeMany ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
