import { EOrder, EOrderBy, EStatusDoc } from '@configs/interface.config';
import { TUserDocument } from '@modules/user/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from '@src/base/service/base.service';
import { plainToInstance } from 'class-transformer';
import { checkMongoId, checkMongoObjectIds } from '@src/utils/objectId.util';
import { FieldAuthorPopulate } from '@src/configs/const.config';

import { ShowTime, TShowtimeDocument } from './entities/showtime.entity';
import {
  BookingShowtimeDto,
  CreateShowtimeDto,
} from './dto/create-showtime.dto';
import { FilmService } from '../film/film.service';
import { RoomService } from '../room/room.service';
import * as dayjs from 'dayjs';
import {
  QueryClientShowtimeDto,
  QueryShowtimeDto,
} from './dto/query-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

@Injectable()
export class ShowtimeService extends BaseService<ShowTime> {
  constructor(
    @InjectModel('showtime')
    private readonly showtimeModel: Model<TShowtimeDocument>,
    private readonly filmService: FilmService,
    private readonly roomService: RoomService,
  ) {
    super(showtimeModel);
  }

  async create(
    body: CreateShowtimeDto,
    user: TUserDocument,
  ): Promise<TShowtimeDocument> {
    Logger.log(
      '======================= Create showtime =======================',
    );
    body = plainToInstance(CreateShowtimeDto, body, {
      excludeExtraneousValues: true,
    });
    const { film, room, day, startHour, endHour } = body;

    /**
     * 1. validate film
     * 2. validate room
     * 3. validate hour
     * 4. validate time with other showtime
     */
    if (film) {
      const filmFound = await this.filmService.findOne(film);
      if (!filmFound) {
        throw new NotFoundException('Film not found!');
      }
    }

    if (room) {
      const roomFound = await this.roomService.findOneRoom(room);
      if (!roomFound) {
        throw new NotFoundException('Room not found!');
      }
    }

    if (dayjs(endHour).isBefore(startHour)) {
      throw new BadRequestException('endHour must be greater than startHour!');
    }

    const duplicatedShowtime = this.showtimeModel
      .find({
        day: { $gte: dayjs(day).startOf('day'), $lte: dayjs(day).endOf('day') },
        endHour: { $gte: startHour },
      })
      .exec();
    if (duplicatedShowtime) {
      throw new BadRequestException('This show time is duplicated!');
    }

    // create showtime
    const newShowtime = new this.showtimeModel({
      ...body,
      author: user,
      editedBy: user,
      status: body.status || EStatusDoc.INACTIVE,
    });
    return await newShowtime.save();
  }

  /**
   *
   * @param {QueryShowtimeDto}query
   * @returns {Promise<{ data: TShowtimeDocument[]; total: number }>}
   */
  async findAll(
    query: QueryShowtimeDto | QueryClientShowtimeDto,
    isCms = false,
  ): Promise<{ data: TShowtimeDocument[]; total: number }> {
    Logger.log('======================= List Showtime =======================');
    query = plainToInstance(QueryShowtimeDto, query, {
      excludeExtraneousValues: true,
    });
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
      s,
      authorId = null,
      day,
      film,
      room,
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

    if (isCms) {
      if (status) {
        condition.push({ status });
      }
    } else {
      condition.push({ status: EStatusDoc.ACTIVE });
    }

    if (day) {
      condition.push({
        day: { $gte: dayjs(day).startOf('day'), $lte: dayjs(day).endOf('day') },
      });
    }

    if (film) {
      checkMongoId(authorId, 'film must be mongoId!');
      condition.push({ film });
    }

    if (room) {
      checkMongoId(authorId, 'room must be mongoId!');
      condition.push({ room });
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

    const data = await this.showtimeModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .populate('author', FieldAuthorPopulate)
      .populate('film')
      .populate('room')
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.showtimeModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );
    return { data, total };
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<TShowtimeDocument>}
   */
  async findOne(id: string, isCms = false): Promise<TShowtimeDocument> {
    Logger.log(
      '======================= FindOne Showtime =======================',
    );
    checkMongoId(id);
    const queryMg = this.showtimeModel.findById(id);
    if (!isCms) queryMg.where({ status: EStatusDoc.ACTIVE });
    queryMg
      .populate('author', FieldAuthorPopulate)
      .populate('film')
      .populate({
        path: 'room',
        populate: { path: 'seats' },
      })
      .populate('seatsHeld')
      .populate('seatsBooked');

    return await queryMg.exec();
  }

  /**
   *
   * @param {string}id
   * @param {UpdateShowtimeDto}body
   * @param {TUserDocument}user
   * @returns {Promise<boolean>}
   */
  async update(
    id: string,
    body: UpdateShowtimeDto,
    user: TUserDocument,
  ): Promise<boolean> {
    Logger.log('================= Update Room ==================');
    const dUpdate = plainToInstance(UpdateShowtimeDto, body, {
      excludeExtraneousValues: true,
    });
    checkMongoId(id, 'ID must be MongoId!');

    const { film, room, day, startHour, endHour } = dUpdate;

    /**
     * 1. validate film
     * 2. validate room
     * 3. validate hour
     * 4. validate time with other showtime
     */
    if (film) {
      const filmFound = await this.filmService.findOne(film);
      if (!filmFound) {
        throw new NotFoundException('Film not found!');
      }
    }

    if (room) {
      const roomFound = await this.roomService.findOneRoom(room);
      if (!roomFound) {
        throw new NotFoundException('Room not found!');
      }
    }

    if (!dayjs(startHour).isSame(day, 'day')) {
      throw new BadRequestException('startHour invalid!');
    }

    if (!dayjs(endHour).isSame(day, 'day')) {
      throw new BadRequestException('endHour invalid!');
    }

    if (dayjs(endHour).isBefore(startHour)) {
      throw new BadRequestException('endHour must be greater than startHour!');
    }

    const duplicatedShowtime = this.showtimeModel
      .find({
        day: { $gte: dayjs(day).startOf('day'), $lte: dayjs(day).endOf('day') },
        endHour: { $gte: startHour },
      })
      .exec();
    if (duplicatedShowtime) {
      throw new BadRequestException('This show time is duplicated!');
    }

    const result = await this.showtimeModel.updateOne(
      { _id: id },
      { ...dUpdate, editedBy: user },
    );

    return !!result.modifiedCount;
  }

  async bookingShowtime(body: BookingShowtimeDto, user: TUserDocument) {
    Logger.log('=================bookingShowtime==================');
    const dUpdate = plainToInstance(BookingShowtimeDto, body, {
      excludeExtraneousValues: true,
    });
    const userId = user._id.toHexString();

    const { idSeat, idShowtime } = dUpdate;
    checkMongoId(idSeat, 'idSeat must be mongoId');
    checkMongoId(idShowtime, 'idShowtime must be mongoId');

    const foundSeat = await this.roomService.findOneSeat(idSeat);
    if (!foundSeat) {
      throw new NotFoundException({ message: 'Seat not found' });
    }

    const foundShowtime = await this.showtimeModel.findById(idShowtime).exec();
    if (!foundShowtime) {
      throw new NotFoundException({ message: 'Showtime not found' });
    }

    // 1. check seat has booked
    const seatsBooked = foundShowtime.seatsBooked.map((item) =>
      item._id.toHexString(),
    );
    if (seatsBooked.includes(idSeat)) {
      throw new BadRequestException({
        message: 'This seat had booked',
      });
    }

    // 2. handle book/unbook seat
    const seatsHeld =
      (foundShowtime.seatsHeld as unknown as {
        user: string;
        seats: string[];
      }[]) || [];
    let newSeatsHeld: { user: string; seats: string[] }[] = [];

    const index = seatsHeld.findIndex(
      (item) => (item.user as unknown as string).toString() === userId,
    );

    if (index >= 0) {
      const currentSeat = seatsHeld[index];
      if (currentSeat.seats.includes(idSeat)) {
        newSeatsHeld = [
          ...newSeatsHeld.slice(0, index),
          {
            ...currentSeat,
            seats: [...currentSeat.seats.filter((item) => item !== idSeat)],
          },
          ...newSeatsHeld.slice(index + 1),
        ];
      } else {
        newSeatsHeld = [
          ...newSeatsHeld.slice(0, index),
          {
            ...currentSeat,
            seats: [...currentSeat.seats, idSeat],
          },
          ...newSeatsHeld.slice(index + 1),
        ];
      }
    } else {
      newSeatsHeld = [...seatsHeld, { user: userId, seats: [idSeat] }];
    }

    const update = await this.showtimeModel.updateOne(
      { _id: idShowtime },
      { $set: { seatsHeld: newSeatsHeld } },
    );

    return !!update.modifiedCount;
  }

  async addSeatsBooked(id: string, seats: string[]) {
    const update = await this.showtimeModel.updateOne(
      { _id: id },
      {
        $addToSet: { seatsBooked: { $each: seats } },
      },
    );
    return update.modifiedCount;
  }
}
