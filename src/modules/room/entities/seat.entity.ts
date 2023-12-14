import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EStatusSeat, ETypeSeat } from '../room.interface';

export type TSeatDocument = Seat & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'seat' })
export class Seat {
  @Prop({
    type: String,
    required: true,
  })
  name: string;
  @Prop({ type: String, enum: ETypeSeat, default: ETypeSeat.NORMAL })
  type: ETypeSeat;

  @Prop({ type: String, enum: EStatusSeat, default: EStatusSeat.ACTIVE })
  status: EStatusSeat;
}

const SeatSchema = SchemaFactory.createForClass(Seat);

export { SeatSchema };
