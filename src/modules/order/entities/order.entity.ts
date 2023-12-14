import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { PersonResponsibleEntity } from '@src/base/entities/default.entity';
import { TUserDocument } from '@src/modules/user/entities/user.entity';
import { EStatusOrder } from '../order.interface';

export type TOrderDocument = Order & Document<Types.ObjectId>;
@Schema({ timestamps: true, collection: 'order' })
export class Order extends PersonResponsibleEntity {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'user',
    required: true,
    default: null,
  })
  user: TUserDocument;

  @Prop({
    type: String,
    required: true,
    default: null,
    index: 1,
  })
  film: string;

  @Prop({
    type: String,
    required: true,
    default: null,
  })
  room: string;

  @Prop({
    type: String,
    required: true,
    default: null,
  })
  seats: string[];

  @Prop({
    type: String,
    required: true,
    default: null,
  })
  price: string;

  @Prop({
    type: Date,
    required: true,
    default: null,
  })
  day: Date;

  @Prop({
    type: Date,
    required: true,
    default: null,
  })
  startHour: Date;

  @Prop({
    type: Date,
    required: true,
    default: null,
  })
  endHour: Date;

  @Prop({ type: String, enum: EStatusOrder, default: EStatusOrder.PENDING })
  status: EStatusOrder;
}

const OrderSchema = SchemaFactory.createForClass(Order);
export { OrderSchema };
