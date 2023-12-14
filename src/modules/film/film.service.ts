import { EOrder, EOrderBy, EStatusDoc } from '@configs/interface.config';
import { TUserDocument } from '@modules/user/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from '@src/base/service/base.service';
import { plainToInstance } from 'class-transformer';
import { checkMongoId, checkMongoObjectIds } from '@src/utils/objectId.util';
import {
  FieldAuthorPopulate,
  FieldFilePopulate,
  FieldTaxPopulate,
} from '@src/configs/const.config';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { MediaService } from '../media/media.service';
import { Film, TFilmDocument } from './entities/film.entity';
import { CreateFilmDto } from './dto/create-film.dto';
import { QueryClientFilmDto, QueryFilmDto } from './dto/query-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';

@Injectable()
export class FilmService extends BaseService<Film> {
  constructor(
    @InjectModel('film') private readonly filmModel: Model<TFilmDocument>,
    private readonly taxonomyService: TaxonomyService,
    private readonly mediaService: MediaService,
  ) {
    super(filmModel);
  }

  /**
   *
   * @param {CreateFilmDto}body
   * @param {TUserDocument}user
   * @returns
   */
  async create(
    body: CreateFilmDto,
    user: TUserDocument,
  ): Promise<TFilmDocument> {
    Logger.log('======================= Create Film =======================');
    body = plainToInstance(CreateFilmDto, body, {
      excludeExtraneousValues: true,
    });
    const { thumbnail, taxonomies, trailer } = body;

    // #1: valid body
    if (taxonomies?.length > 0) {
      checkMongoObjectIds(taxonomies, 'Taxonomies must be [mongoId]!');
      const taxonomiesInDb = await this.taxonomyService.findAllInIds(
        taxonomies,
      );
      if (taxonomiesInDb.length !== taxonomies.length) {
        throw new BadRequestException('Taxonomies is not valid!');
      }
    }

    if (thumbnail) {
      checkMongoId(thumbnail, 'Thumbnail must be MongoId!');
      const thumbnailInDb = await this.mediaService.findOneFile(thumbnail);
      if (!thumbnailInDb) {
        throw new BadRequestException('Thumbnail is not valid!');
      }
    }

    if (trailer) {
      checkMongoId(trailer, 'Trailer must be MongoId!');
      const trailerInDb = await this.mediaService.findOneFile(trailer);
      if (!trailerInDb) {
        throw new BadRequestException('Trailer is not valid!');
      }
    }

    // #2: Generate slug
    const slug = await this.generateSlugBase(body.name);

    // #3: Create film
    const newFilm = new this.filmModel({
      ...body,
      slug,
      thumbnail,
      taxonomies,
      author: user,
      editedBy: user,
      status: body.status || EStatusDoc.INACTIVE,
    });
    return await newFilm.save();
  }

  /**
   *
   * @param {QueryFilmDto}query
   * @returns {Promise<{ data: TFilmDocument[]; total: number }>}
   */
  async findAll(
    query: QueryFilmDto | QueryClientFilmDto,
    isCms = false,
  ): Promise<{ data: TFilmDocument[]; total: number }> {
    Logger.log('======================= List Film =======================');
    query = plainToInstance(QueryFilmDto, query, {
      excludeExtraneousValues: true,
    });
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
      s,
      authorId = null,
    } = query;

    const status = query?.['status'] || null;
    const taxonomyIds = query?.['taxonomyIds[]'] || [];
    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];
    const skip = (+page - 1) * +limit;
    const condition = [];
    const textS = s?.trim();

    if (textS) {
      condition.push({
        $or: [
          { name: { $regex: String(textS), $options: 'i' } },
          { excerpt: { $regex: String(textS), $options: 'i' } },
          { content: { $regex: String(textS), $options: 'i' } },
        ],
      });
    }

    if (authorId) {
      checkMongoId(authorId, 'AuthorId must be mongoId!');
      condition.push({ author: authorId });
    }

    if (taxonomyIds?.length > 0) {
      checkMongoObjectIds(taxonomyIds, 'TaxonomyIds must be [mongoId]');
      condition.push({ taxonomies: { $in: taxonomyIds } });
    }

    // Client chỉ query được các film đã active
    if (isCms) {
      if (status) {
        condition.push({ status });
      }
    } else {
      condition.push({ status: EStatusDoc.ACTIVE });
    }

    if (notInIds?.length > 0) {
      checkMongoObjectIds(notInIds, 'NotInIds must be [mongoId]');
      condition.push({ _id: { $nin: notInIds } });
    }

    if (inIds?.length > 0) {
      checkMongoObjectIds(inIds, 'InIds must be [mongoId]');
      condition.push({ _id: { $in: inIds } });
    }

    const data = await this.filmModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .populate('thumbnail', FieldFilePopulate)
      .populate('trailer', FieldFilePopulate)
      .populate('taxonomies', FieldTaxPopulate)
      .populate('author', FieldAuthorPopulate)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.filmModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );
    return { data, total };
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<TFilmDocument>}
   */
  async findOne(id: string, isCms = true): Promise<TFilmDocument> {
    Logger.log('======================= FindOne Film =======================');
    checkMongoId(id);
    const queryMg = this.filmModel.findById(id);
    if (!isCms) queryMg.where({ status: EStatusDoc.ACTIVE });
    queryMg
      .populate('thumbnail', FieldFilePopulate)
      .populate('trailer', FieldFilePopulate)
      .populate('taxonomies', FieldTaxPopulate)
      .populate('author', FieldAuthorPopulate);
    return await queryMg.exec();
  }

  /**
   *
   * @param {string}slug
   * @returns {Promise<TFilmDocument>}
   */
  async findOneBySlug(slug: string): Promise<TFilmDocument> {
    Logger.log('================= FindOne Film by Slug ==================');
    return await this.filmModel
      .findOne()
      .where({ slug, status: EStatusDoc.ACTIVE })
      .populate('thumbnail', FieldFilePopulate)
      .populate('taxonomies', FieldTaxPopulate)
      .populate('author', FieldAuthorPopulate)
      .exec();
  }

  /**
   *
   * @param {string}id
   * @param {UpdateFilmDto}body
   * @param {TUserDocument}user
   * @returns {Promise<boolean>}
   */
  async update(
    id: string,
    body: UpdateFilmDto,
    user: TUserDocument,
  ): Promise<boolean> {
    Logger.log('================= Update Film ==================');
    const dUpdate = plainToInstance(UpdateFilmDto, body, {
      excludeExtraneousValues: true,
    });
    const { taxonomies, thumbnail, trailer } = dUpdate;

    checkMongoId(id, 'ID must be MongoId!');
    const film = await this.filmModel.findById(id).exec();
    if (!film) throw new NotFoundException({ message: 'Film not found!' });

    checkMongoObjectIds(taxonomies, 'Taxonomies must be [mongoId]!');
    checkMongoId(thumbnail, 'Thumbnail must be MongoId!');
    checkMongoId(trailer, 'Trailer must be MongoId!');

    const result = await this.filmModel.updateOne(
      { _id: id },
      { ...dUpdate, editedBy: user },
    );

    return !!result.modifiedCount;
  }
}
