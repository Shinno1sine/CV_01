import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { StatusDocEntity } from '@src/base/entities/default.entity';
import { Document, Types } from 'mongoose';

export type TLayoutDocument = Layout & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'layout' })
export class Layout extends StatusDocEntity {
  @Prop({
    type: String,
    required: true,
    maxlength: 255,
    minlength: 3,
  })
  name: string;

  @Prop({
    type: Number,
    required: true,
  })
  row: number;

  @Prop({
    type: Number,
    required: true,
  })
  column: number;
}

const LayoutSchema = SchemaFactory.createForClass(Layout);

export { LayoutSchema };
