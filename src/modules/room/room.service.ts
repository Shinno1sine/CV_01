import { EOrder, EOrderBy, EStatusDoc } from '@configs/interface.config';
import { TUserDocument } from '@modules/user/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseService } from '@src/base/service/base.service';
import { plainToInstance } from 'class-transformer';
import { checkMongoId, checkMongoObjectIds } from '@src/utils/objectId.util';
import { FieldAuthorPopulate } from '@src/configs/const.config';
import { Room, TRoomDocument } from './entities/room.entity';
import { CreateLayoutDto, CreateRoomDto } from './dto/create-room.dto';
import { TLayoutDocument } from './entities/layout.entity';
import { TSeatDocument } from './entities/seat.entity';
import { EStatusSeat, ETypeSeat } from './room.interface';
import { QueryLayoutDto, QueryRoomDto } from './dto/query-room.dto';
import {
  UpdateLayoutDto,
  UpdateRoomDto,
  UpdateSeatDto,
} from './dto/update-room.dto';
import { isMongoId } from 'class-validator';

@Injectable()
export class RoomService extends BaseService<Room> {
  constructor(
    @InjectModel('room') private readonly roomModel: Model<TRoomDocument>,
    @InjectModel('layout') private readonly layoutModel: Model<TLayoutDocument>,
    @InjectModel('seat') private readonly seatModel: Model<TSeatDocument>,
  ) {
    super(roomModel);
  }

  /** ROOM ========================================== ROOM */
  /**
   * create room
   * @param body
   * @param user
   * @returns
   */
  async createRoom(
    body: CreateRoomDto,
    user: TUserDocument,
  ): Promise<TRoomDocument> {
    Logger.log('======================= Create Room =======================');
    body = plainToInstance(CreateRoomDto, body, {
      excludeExtraneousValues: true,
    });
    console.log('🚀 ~ file: room.service.ts:51 ~ RoomService ~ body:', body);
    const { layout: layoutId } = body;

    // #1: valid body
    let layout: TLayoutDocument;
    if (layoutId) {
      layout = await this.findOneLayout(layoutId);
      if (!layout) {
        throw new BadRequestException('Layout is not valid!');
      }
    }

    // #2: Generate seat
    const seats = await this.generateSeats(layout.row, layout.column);
    console.log('🚀 ~ file: room.service.ts:66 ~ RoomService ~ seats:', seats);

    // #3: Create room
    const newRoom = new this.roomModel({
      name: body.name,
      content: body?.content || null,
      excerpt: body?.excerpt || null,
      layout: layoutId,
      seats: seats,
      author: user,
      editedBy: user,
      status: body.status || EStatusDoc.INACTIVE,
    });
    return await newRoom.save();
  }

  /**
   *
   * @param {QueryRoomDto}query
   * @returns {Promise<{ data: TRoomDocument[]; total: number }>}
   */
  async findAllRoom(
    query: QueryRoomDto,
  ): Promise<{ data: TRoomDocument[]; total: number }> {
    Logger.log('======================= List Room =======================');
    query = plainToInstance(QueryRoomDto, query, {
      excludeExtraneousValues: true,
    });
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
      s,
      authorId = null,
    } = query;

    const status = query?.['status'] || null;
    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];
    const skip = (+page - 1) * +limit;
    const condition = [];
    const textS = s?.trim();

    if (textS) {
      condition.push({
        $or: [
          { name: { $regex: String(textS), $options: 'i' } },
          { excerpt: { $regex: String(textS), $options: 'i' } },
          { content: { $regex: String(textS), $options: 'i' } },
        ],
      });
    }

    if (status) {
      condition.push({ status });
    }

    if (authorId) {
      checkMongoId(authorId, 'AuthorId must be mongoId!');
      condition.push({ author: authorId });
    }

    if (notInIds?.length > 0) {
      checkMongoObjectIds(notInIds, 'NotInIds must be [mongoId]');
      condition.push({ _id: { $nin: notInIds } });
    }

    if (inIds?.length > 0) {
      checkMongoObjectIds(inIds, 'InIds must be [mongoId]');
      condition.push({ _id: { $in: inIds } });
    }

    const data = await this.roomModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .populate('author', FieldAuthorPopulate)
      .populate('layout')
      .populate('seats')
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.roomModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );
    return { data, total };
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<TRoomDocument>}
   */
  async findOneRoom(id: string): Promise<TRoomDocument> {
    Logger.log('======================= FindOne Room =======================');
    checkMongoId(id);
    return await this.roomModel
      .findById(id)
      .populate('author', FieldAuthorPopulate)
      .populate('layout')
      .populate('seats')
      .exec();
  }

  /**
   *
   * @param {string}id
   * @param {UpdateRoomDto}body
   * @param {TUserDocument}user
   * @returns {Promise<boolean>}
   */
  async updateRoom(
    id: string,
    body: UpdateRoomDto,
    user: TUserDocument,
  ): Promise<boolean> {
    Logger.log('================= Update Room ==================');
    const dUpdate = plainToInstance(UpdateRoomDto, body, {
      excludeExtraneousValues: true,
    });

    const { layout } = dUpdate;

    checkMongoId(id, 'ID must be MongoId!');
    const room = await this.roomModel.findById(id).exec();
    if (!room) throw new NotFoundException({ message: 'Room not found!' });

    checkMongoId(layout, 'Layout must be MongoId!');

    const result = await this.roomModel.updateOne(
      { _id: id },
      { ...dUpdate, editedBy: user },
    );

    return !!result.modifiedCount;
  }

  /** LAYOUT====================================LAYOUT */
  /**
   * create LAYOUT
   * @param body
   * @param user
   * @returns
   */
  async createLayout(
    body: CreateLayoutDto,
    user: TUserDocument,
  ): Promise<TLayoutDocument> {
    Logger.log('======================= Create Layout =======================');
    body = plainToInstance(CreateLayoutDto, body, {
      excludeExtraneousValues: true,
    });

    const newlayout = new this.layoutModel({
      ...body,
      author: user,
      editedBy: user,
      status: body.status || EStatusDoc.INACTIVE,
    });
    return await newlayout.save();
  }

  /**
   *
   * @param {QueryLayoutDto}query
   * @returns {Promise<{ data: TLayoutDocument[]; total: number }>}
   */
  async findAllLayout(
    query: QueryLayoutDto,
  ): Promise<{ data: TLayoutDocument[]; total: number }> {
    Logger.log('======================= List Layout =======================');
    query = plainToInstance(QueryLayoutDto, query, {
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
        $or: [{ name: { $regex: String(textS), $options: 'i' } }],
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

    const data = await this.layoutModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.layoutModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );
    return { data, total };
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<TLayoutDocument>}
   */
  async findOneLayout(id: string): Promise<TLayoutDocument> {
    Logger.log(
      '======================= FindOne Layout =======================',
    );
    checkMongoId(id);
    return await this.layoutModel.findById(id).exec();
  }

  /**
   *
   * @param {string}id
   * @param {UpdateLayoutDto}body
   * @param {TUserDocument}user
   * @returns {Promise<boolean>}
   */
  async updateLayout(id: string, body: UpdateLayoutDto): Promise<boolean> {
    Logger.log('================= Update Layout ==================');
    const dUpdate = plainToInstance(UpdateLayoutDto, body, {
      excludeExtraneousValues: true,
    });

    checkMongoId(id, 'ID must be MongoId!');
    const layout = await this.layoutModel.findById(id).exec();
    if (!layout) throw new NotFoundException({ message: 'Layout not found!' });

    const result = await this.layoutModel.updateOne(
      { _id: id },
      { ...dUpdate },
    );
    return !!result.modifiedCount;
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<boolean>}
   */
  async removeLayout(id: string): Promise<boolean> {
    Logger.log('================== remove layout ==================');
    if (!isMongoId(id))
      throw new BadRequestException({
        message: 'ID must be MongoId!',
      });
    const layout = await this.layoutModel.findById(id);
    if (!layout) throw new NotFoundException({ message: 'Layout not found!' });
    const result = await this.layoutModel.deleteOne({ _id: id });
    return !!result.deletedCount;
  }

  /** SEAT====================================SEAT */

  /**
   *
   * @param {string[]}ids
   * @returns {Promise<TTaxonomyDocument[]>}
   */
  async findAllSeatInIds(ids: string[]): Promise<TSeatDocument[]> {
    if (ids?.length <= 0) return [];
    const data = await this.seatModel
      .find()
      .where({ _id: { $in: ids } })
      .exec();
    return data;
  }
  /**
   * generateSeats
   * @param row
   * @param column
   * @returns
   */
  async generateSeats(row: number, column: number): Promise<Types.ObjectId[]> {
    /**
     * 1. validate row, column > 0
     * 2. generate seats
     * 3. save to db
     */
    if (row <= 0 || column <= 0) {
      throw new BadRequestException({ message: 'Layout invalid!' });
    }

    const seats = [];
    for (let i = 1; i <= row; i++) {
      for (let j = 1; j <= column; j++) {
        seats.push(String.fromCharCode(i + 64) + j);
      }
    }
    return await Promise.all(
      seats.sort().map(async (seat) => {
        const newSeat = new this.seatModel({
          name: seat,
          type: ETypeSeat.NORMAL,
          status: EStatusSeat.ACTIVE,
        });
        return (await newSeat.save())._id;
      }),
    );
  }

  /**
   *
   * @param {string}id
   * @param {UpdateSeatDto}body
   * @param {TUserDocument}user
   * @returns {Promise<boolean>}
   */
  async updateSeat(id: string, body: UpdateSeatDto): Promise<boolean> {
    Logger.log('================= Update Seat ==================');
    const dUpdate = plainToInstance(UpdateSeatDto, body, {
      excludeExtraneousValues: true,
    });

    checkMongoId(id, 'ID must be MongoId!');
    const seat = await this.seatModel.findById(id).exec();
    if (!seat) throw new NotFoundException({ message: 'Seat not found!' });

    const result = await this.seatModel.updateOne({ _id: id }, { ...dUpdate });
    return !!result.modifiedCount;
  }

  async findOneSeat(id: string): Promise<TSeatDocument> {
    Logger.log('================= findOneSeat ==================');
    checkMongoId(id, 'ID must be MongoId!');
    return await this.seatModel.findById(id).exec();
  }
}
