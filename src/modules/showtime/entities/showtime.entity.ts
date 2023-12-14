import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { DefaultEntity } from '@src/base/entities/default.entity';
import { TRoomDocument } from '@src/modules/room/entities/room.entity';
import { TFilmDocument } from '@src/modules/film/entities/film.entity';
import { TSeatDocument } from '@src/modules/room/entities/seat.entity';
import { SeatHeldSchema } from './seatHeld.entity';

export type TShowtimeDocument = ShowTime & Document<Types.ObjectId>;
@Schema({ timestamps: true, collection: 'showtime' })
export class ShowTime extends DefaultEntity {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'film',
    required: true,
    default: null,
  })
  film: TFilmDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'room',
    required: true,
    default: null,
  })
  room: TRoomDocument;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'seat',
    required: true,
    default: [],
  })
  seatsBooked: TSeatDocument[];

  @Prop(
    raw([
      {
        _id: false,
        user: {
          type: MongooseSchema.Types.ObjectId,
          required: true,
          ref: 'user',
        },
        seats: {
          type: [MongooseSchema.Types.ObjectId],
          required: true,
          ref: 'seat',
        },
      },
    ]),
  )
  seatsHeld: SeatHeldSchema[];

  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  price: number;

  @Prop({
    type: Date,
    required: true,
    default: new Date(),
  })
  day: Date;

  @Prop({
    type: Date,
    required: true,
    default: new Date(),
  })
  startHour: Date;

  @Prop({
    type: Date,
    required: true,
    default: new Date(),
  })
  endHour: Date;
}

const ShowtimeSchema = SchemaFactory.createForClass(ShowTime);
export { ShowtimeSchema };
