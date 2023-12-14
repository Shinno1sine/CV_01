import { TUserDocument } from '@modules/user/entities/user.entity';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from '@src/base/service/base.service';
import { plainToInstance } from 'class-transformer';
import { checkMongoId, checkMongoObjectIds } from '@src/utils/objectId.util';
import { Order, TOrderDocument } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ShowtimeService } from '../showtime/showtime.service';
import { RoomService } from '../room/room.service';
import { QueryMyOrderDto, QueryOrderDto } from './dto/query-order.dto';
import { EOrder, EOrderBy } from '@src/configs/interface.config';
import { FieldAuthorPopulate } from '@src/configs/const.config';
import { ApproveOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService extends BaseService<Order> {
  constructor(
    @InjectModel('order') private readonly orderModel: Model<TOrderDocument>,
    private readonly showtimeService: ShowtimeService,
    private readonly roomService: RoomService,
  ) {
    super(orderModel);
  }

  /**
   *
   * @param {CreateFilmDto}body
   * @param {TUserDocument}user
   * @returns
   */
  async create(
    body: CreateOrderDto,
    user: TUserDocument,
  ): Promise<TOrderDocument> {
    Logger.log('======================= Create Order =======================');
    body = plainToInstance(CreateOrderDto, body, {
      excludeExtraneousValues: true,
    });
    const { seats, showtime } = body;

    // #1: valid body
    checkMongoId(showtime, 'showtime must be MongoId!');
    const showtimeInDb = await this.showtimeService.findOne(showtime);
    if (!showtimeInDb) {
      throw new BadRequestException('showtime is not valid!');
    }

    checkMongoObjectIds(seats, 'seats must be [mongoId]!');
    const seatsInDb = await this.roomService.findAllSeatInIds(seats);
    if (seatsInDb.length !== seats.length) {
      throw new BadRequestException('seats is not valid!');
    }

    const seatIdsInRoom = showtimeInDb.room.seats.map((s) => s._id);
    if (seatsInDb.some((s) => !seatIdsInRoom.includes(s._id))) {
      throw new BadRequestException({ message: 'seats is not valid' });
    }

    // #2: Create order
    const newOrder = new this.orderModel({
      user: user._id,
      film: showtimeInDb.film.name,
      room: showtimeInDb.room.name,
      seats: seatsInDb.map((seat) => seat.name),
      price: showtimeInDb.price * seats.length,
      day: showtimeInDb.day,
      startHour: showtimeInDb.startHour,
      endHour: showtimeInDb.endHour,
    });

    await this.showtimeService.addSeatsBooked(
      showtimeInDb._id.toHexString(),
      seats,
    );

    return await newOrder.save();
  }

  /**
   *
   * @param {QueryOrderDto}query
   * @returns {Promise<{ data: TOrderDocument[]; total: number }>}
   */
  async findAll(
    query: QueryOrderDto,
  ): Promise<{ data: TOrderDocument[]; total: number }> {
    Logger.log('======================= List Order =======================');
    query = plainToInstance(QueryOrderDto, query, {
      excludeExtraneousValues: true,
    });
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
      s,
      userId,
    } = query;

    const status = query?.['status'] || null;
    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];
    const skip = (+page - 1) * +limit;
    const condition = [];
    const textS = s?.trim();

    if (textS) {
      condition.push({
        $or: [{ film: { $regex: String(textS), $options: 'i' } }],
      });
    }

    if (status) {
      condition.push({ status });
    }

    if (userId) {
      checkMongoId(userId, 'userId must be mongoId!');
      condition.push({ user: userId });
    }

    if (notInIds?.length > 0) {
      checkMongoObjectIds(notInIds, 'NotInIds must be [mongoId]');
      condition.push({ _id: { $nin: notInIds } });
    }

    if (inIds?.length > 0) {
      checkMongoObjectIds(inIds, 'InIds must be [mongoId]');
      condition.push({ _id: { $in: inIds } });
    }

    const data = await this.orderModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .populate('user', FieldAuthorPopulate)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.orderModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );
    return { data, total };
  }

  /**
   *
   * @param {QueryMyOrderDto}query
   * @returns {Promise<{ data: TOrderDocument[]; total: number }>}
   */
  async findAllMyOrder(
    user: TUserDocument,
    query: QueryMyOrderDto,
  ): Promise<{ data: TOrderDocument[]; total: number }> {
    Logger.log('======================= List my Order =======================');
    query = plainToInstance(QueryMyOrderDto, query, {
      excludeExtraneousValues: true,
    });
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
      s,
    } = query;

    const status = query?.['status'] || null;
    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];
    const skip = (+page - 1) * +limit;
    const condition = [];
    const textS = s?.trim();

    if (textS) {
      condition.push({
        $or: [{ film: { $regex: String(textS), $options: 'i' } }],
      });
    }

    if (status) {
      condition.push({ status });
    }

    if (notInIds?.length > 0) {
      checkMongoObjectIds(notInIds, 'NotInIds must be [mongoId]');
      condition.push({ _id: { $nin: notInIds } });
    }

    if (inIds?.length > 0) {
      checkMongoObjectIds(inIds, 'InIds must be [mongoId]');
      condition.push({ _id: { $in: inIds } });
    }

    const data = await this.orderModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.orderModel.countDocuments(
      condition?.length > 0 ? { $and: [{ user: user._id }, ...condition] } : {},
    );
    return { data, total };
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<TOrderDocument>}
   */
  async findOne(id: string): Promise<TOrderDocument> {
    Logger.log('======================= FindOne Order =======================');
    checkMongoId(id);
    return await this.orderModel
      .findById(id)
      .populate('user', FieldAuthorPopulate);
  }

  /**
   *
   * @param id
   * @param body
   */
  async approve(id: string, body: ApproveOrderDto) {
    const dUpdate = plainToInstance(ApproveOrderDto, body, {
      excludeExtraneousValues: true,
    });
    const { status } = dUpdate;
    checkMongoId(id, 'ID must be MongoId!');

    const update = await this.orderModel.updateOne(
      { _id: id },
      {
        status,
      },
    );

    return update.modifiedCount;
  }
}
