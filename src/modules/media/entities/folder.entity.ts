import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mongooseSchema, Types } from 'mongoose';
import { PersonResponsibleEntity } from 'src/base/entities/default.entity';

export type TFolderDocument = Folder & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'folder' })
export class Folder extends PersonResponsibleEntity {
  @Prop({
    type: String,
    required: true,
    maxlength: 30,
    minlength: 3,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    maxlength: 30,
    minlength: 3,
  })
  nameSort: string;

  @Prop({
    type: mongooseSchema.Types.ObjectId,
    ref: 'folder',
    default: null,
  })
  parent: Folder;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  left: number;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  right: number;
}

const FolderSchema = SchemaFactory.createForClass(Folder);

export { FolderSchema };
