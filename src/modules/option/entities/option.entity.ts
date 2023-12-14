import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PersonResponsibleEntity } from '@src/base/entities/default.entity';
import { azUppercaseRegex } from '@src/utils/string.util';
import { Matches, IsString } from 'class-validator';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type TOptionDocument = Option & Document<Types.ObjectId>;
@Schema({ timestamps: true, collection: 'option' })
export class Option extends PersonResponsibleEntity {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
    minlength: 3,
    maxlength: 50,
    trim: true,
  })
  @Matches(azUppercaseRegex, {
    message: 'Key must be uppercase letters [A-Z]',
  })
  @IsString()
  key: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  value: any;
}

const OptionSchema = SchemaFactory.createForClass(Option);

export { OptionSchema };
