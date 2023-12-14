import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as mongooseSchema, Query } from 'mongoose';
import { alphabetRegex, convertTitleToSlug } from '@utils/string.util';
import { PersonResponsibleEntity } from 'src/base/entities/default.entity';

export type TTaxonomyDocument = Taxonomy & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'taxonomy' })
export class Taxonomy extends PersonResponsibleEntity {
  @Prop({
    type: String,
    required: true,
    maxlength: 191,
    minlength: 3,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    maxlength: 191,
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

  @Prop({ type: String, default: null })
  description: string;

  @Prop({
    type: mongooseSchema.Types.ObjectId,
    ref: 'taxonomy',
    default: null,
  })
  parent: Taxonomy;

  @Prop({
    type: String,
    required: true,
    maxlength: 30,
    minlength: 3,
    uppercase: true,
    match: alphabetRegex,
  })
  postType: string;

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

const TaxonomySchema = SchemaFactory.createForClass(Taxonomy);

TaxonomySchema.pre<TTaxonomyDocument>('validate', function () {
  if (this.isNew && this.name) {
    this.nameSort = convertTitleToSlug(this.name);
  }
});

TaxonomySchema.pre<Query<any, TTaxonomyDocument>>(
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

export { TaxonomySchema };
