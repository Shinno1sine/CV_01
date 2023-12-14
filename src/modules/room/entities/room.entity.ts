import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { DefaultEntity } from '@src/base/entities/default.entity';
import { TLayoutDocument } from './layout.entity';
import { TSeatDocument } from './seat.entity';

export type TRoomDocument = Room & Document<Types.ObjectId>;
@Schema({ timestamps: true, collection: 'room' })
export class Room extends DefaultEntity {
  @Prop({
    type: String,
    required: true,
    maxlength: 255,
    minlength: 3,
    index: true,
  })
  name: string;

  @Prop({ type: String, default: null })
  content: string;

  @Prop({ type: String, default: null })
  excerpt: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'layout',
    required: true,
    default: null,
  })
  layout: TLayoutDocument;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'seat',
    required: true,
    default: null,
  })
  seats: TSeatDocument[];
}

const RoomSchema = SchemaFactory.createForClass(Room);
export { RoomSchema };
