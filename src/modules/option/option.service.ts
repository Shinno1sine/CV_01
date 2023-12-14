import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUpdateManyOptionDto } from './dto/create-update-option.dto';
import { TOptionDocument } from './entities/option.entity';
import { TUserDocument } from '../user/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { isAzUppercaseRegex } from '@src/utils/string.util';
import { TResCreateUpdateOption } from './option.interface';
import { QueryOptionDto } from './dto/query-option.dto';
import { EOrder, EOrderBy } from '@src/configs/interface.config';
import { checkMongoId, checkMongoObjectIds } from '@src/utils/objectId.util';
import { FieldAuthorPopulate } from '@src/configs/const.config';

@Injectable()
export class OptionService {
  constructor(
    @InjectModel('option')
    private readonly optionModel: Model<TOptionDocument>,
  ) {}

  /**
   *
   * @param {CreateUpdateManyOptionDto}body
   * @param {TUserDocument}user
   * @returns {Promise<TResCreateUpdateOption[]>}
   */
  async create(
    body: CreateUpdateManyOptionDto,
    user: TUserDocument,
  ): Promise<TResCreateUpdateOption[]> {
    Logger.log('============= Create or Update Options ===============');
    body = plainToInstance(CreateUpdateManyOptionDto, body, {
      excludeExtraneousValues: true,
    });
    const { options } = body;

    // #1: Validation
    if (options?.length <= 0) {
      throw new BadRequestException({
        message: 'Options must be array.',
      });
    }

    // Valid "key"
    const keysFlag = options.filter((option) => {
      return !option?.key || !isAzUppercaseRegex(option?.key);
    });
    if (keysFlag?.length > 0) {
      throw new BadRequestException({
        message: 'There is an element whose [key] value is not valid.',
      });
    }

    // Valid "value"
    const valueFlag = options.filter((option) => {
      return !option?.value;
    });
    if (valueFlag?.length > 0) {
      throw new BadRequestException({
        message: 'There is an element with a [value] that does not have.',
      });
    }

    // Loop options: create/update option
    const res = await Promise.all(
      options.map(async (option, index) => {
        const key = option?.key.trim();
        const value = option?.value;
        const objRes: TResCreateUpdateOption = {
          index: 0,
          key: '',
          status: true,
          message: 'Create Option Success!',
        };
        objRes.index = index;
        objRes.key = option.key;

        const theOption = await this.optionModel.findOne({ key });

        if (theOption) {
          const res = await this.optionModel.updateOne(
            { key },
            { value, editedBy: user },
          );
          objRes.status = !!res.modifiedCount;
          objRes.message = !!res.modifiedCount
            ? 'Update option success!'
            : 'Update option failed!';
        } else {
          const newOption = new this.optionModel({
            key,
            value,
            author: user,
            editedBy: user,
          });
          const res = await newOption.save();
          objRes.status = !!res?._id;
          objRes.message = !!res?._id
            ? 'Create option success!'
            : 'Create option failed!';
          objRes.data = res.toJSON();
        }
        return objRes;
      }),
    );
    return res;
  }

  /**
   *
   * @param {QueryOptionDto}query
   * @returns {Promise<{ data: TOptionDocument[]; total: number }>}
   */
  async findAll(
    query: QueryOptionDto,
  ): Promise<{ data: TOptionDocument[]; total: number }> {
    Logger.log('============= Find All Option ===============');
    query = plainToInstance(QueryOptionDto, query, {
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
    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];
    const skip = (+page - 1) * +limit;
    const condition = [];
    const textS = s?.trim();

    if (textS) {
      condition.push({
        $or: [{ key: { $regex: String(textS), $options: 'i' } }],
      });
    }

    if (authorId) {
      checkMongoId(authorId, 'AuthorId must be mongoId!');
      condition.push({ author: authorId });
    }

    if (notInIds?.length > 0) {
      checkMongoObjectIds(notInIds, 'NotInIds must be [mongoId]');
      condition.push({ _id: { $nin: notInIds } });
    }

    if (inIds?.length > 0) {
      checkMongoObjectIds(inIds, 'InIds must be [mongoId]');
      condition.push({ _id: { $in: inIds } });
    }

    const data = await this.optionModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .populate('author', FieldAuthorPopulate)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.optionModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );
    return { data, total };
  }

  /**
   *
   * @param {string[]}keys
   * @returns { Promise<TOptionDocument[]>}
   */
  async findByKeys(keys: string[]): Promise<TOptionDocument[]> {
    Logger.log('=============== Get Options By Key ===============');
    // #1: Validation
    if (keys?.length <= 0)
      throw new BadRequestException({ message: 'keys is required!' });
    const keysFlag = keys.filter((item) => {
      return !isAzUppercaseRegex(item) || !item;
    });
    if (keysFlag?.length > 0) {
      throw new BadRequestException({
        message: 'There is an element whose [key] value is not valid.',
      });
    }
    const res = await this.optionModel
      .find()
      .where({ key: { $in: keys } })
      .exec();
    return res;
  }

  /**
   *
   * @param {string[]}keys
   * @returns {Promise<boolean>}
   */
  async remove(keys: string[]): Promise<boolean> {
    Logger.log('=============== Delete Options By Key ===============');
    // #1: Validation
    if (keys?.length <= 0)
      throw new BadRequestException({ message: 'keys is required!' });
    const keysFlag = keys.filter((item) => {
      return !isAzUppercaseRegex(item) || !item;
    });
    if (keysFlag?.length > 0) {
      throw new BadRequestException({
        message: 'There is an element whose [key] value is not valid.',
      });
    }

    const res = await this.optionModel.deleteMany({ key: { $in: keys } });
    return !!res.deletedCount;
  }
}
