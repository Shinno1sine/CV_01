import { File } from '@modules/media/entities/file.entity';
import { Taxonomy } from '@modules/taxonomy/entities/taxonomy.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { convertTitleToSlug } from '@src/utils/string.util';
import { Document, Types, Schema as MongooseSchema, Query } from 'mongoose';
import { DefaultEntity } from 'src/base/entities/default.entity';

export type TFilmDocument = Film & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'film' })
export class Film extends DefaultEntity {
  @Prop({
    type: String,
    required: true,
    maxlength: 255,
    minlength: 3,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    maxlength: 255,
    minlength: 3,
    index: true,
  })
  nameSort: string;

  @Prop({
    type: String,
    required: true,
    maxlength: 255,
    minlength: 3,
    index: true,
    unique: true,
  })
  slug: string;

  @Prop({
    type: String,
    default: null,
  })
  director: string;

  @Prop({
    type: String,
    default: null,
  })
  actor: string;

  @Prop({ type: String, default: null })
  content: string;

  @Prop({ type: String, default: null })
  excerpt: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'file', default: null })
  thumbnail: File;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'file', default: null })
  trailer: File;

  @Prop({ type: String, default: null })
  trailerUrl: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'taxonomy' }],
    default: [],
  })
  taxonomies: Taxonomy[];

  @Prop({ type: Date, default: new Date(), required: true })
  scheduleAt: Date;
}

const FilmSchema = SchemaFactory.createForClass(Film);

FilmSchema.pre<TFilmDocument>('validate', function () {
  if (this.isNew && this.name) this.nameSort = convertTitleToSlug(this.name);
  if (this.isNew && !this.scheduleAt) this.scheduleAt = new Date();
});

FilmSchema.pre<Query<any, TFilmDocument>>(
  'updateOne',
  { document: false, query: true },
  function (next) {
    const { _id } = this.getQuery();
    const data: any = this.getUpdate();
    if (data?.name !== undefined) {
      data.nameSort = convertTitleToSlug(data.name);
      this.model.updateOne({ _id }, data).clone();
    }
    next();
  },
);

export { FilmSchema };
