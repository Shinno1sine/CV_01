import { Prop, Schema } from '@nestjs/mongoose';
import { TSeatDocument } from '@src/modules/room/entities/seat.entity';
import { TUserDocument } from '@src/modules/user/entities/user.entity';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { Schema as MongooseSchema } from 'mongoose';

@Schema()
export class SeatHeldSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'user' })
  @IsNotEmpty()
  @IsMongoId()
  user: TUserDocument;

  @Prop({ type: [MongooseSchema.Types.ObjectId], required: true, ref: 'seat' })
  @IsNotEmpty()
  @IsMongoId({ each: true })
  seats: TSeatDocument[];
}
