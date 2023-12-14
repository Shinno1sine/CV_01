import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { PersonResponsibleEntity } from 'src/base/entities/default.entity';
import { EMediaSystem } from '../media.interface';
import { Folder } from './folder.entity';

export type TFileDocument = File & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'file' })
export class File extends PersonResponsibleEntity {
  @Prop({ type: String, required: true, maxlength: 255, minlength: 1 })
  name: string;

  @Prop({ type: String, default: null, maxlength: 255, minlength: 1 })
  originalname: string;

  @Prop({ type: Number, required: true })
  size: number;

  @Prop({ type: String, required: true, maxlength: 191 })
  extension: string;

  @Prop({ type: String, required: true, maxlength: 191 })
  mimetype: string;

  @Prop({ type: String, required: true, maxlength: 191 })
  bucket: string;

  @Prop({ type: String, required: true, maxlength: 400 })
  location: string;

  @Prop({ type: String, required: true, maxlength: 191 })
  key: string;

  @Prop({ type: Number, default: null })
  width: number;

  @Prop({ type: Number, default: null })
  height: number;

  @Prop({ type: String, default: null, maxlength: 191 })
  alt: string;

  @Prop({ type: String, default: null, maxlength: 191 })
  caption: string;

  @Prop({ type: String, default: null, maxlength: 400 })
  description: string;

  @Prop({
    require: true,
    type: String,
    enum: EMediaSystem,
    default: EMediaSystem.S3,
  })
  system: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'folder',
    default: null,
  })
  folder: Folder;
}

const FileSchema = SchemaFactory.createForClass(File);

export { FileSchema };
