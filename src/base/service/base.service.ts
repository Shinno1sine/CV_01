import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { convertTitleToSlug, isSlug } from '@src/utils/string.util';
import { isMongoId } from 'class-validator';
import { Model } from 'mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RemoveManyDto } from '../dto/remove-many.dto';

export class BaseService<Entity> {
  constructor(protected model: Model<Entity & Document>) {}

  /**
   *
   * @param {string}slug
   * @returns {Promise<string>}
   */
  async uniqueSlugBase(slug: string): Promise<string> {
    let result = slug.trim();
    const post = await this.model.findOne().where({ slug }).exec();
    if (post) {
      const uniqueSlug = uuidv4().substring(5, 10);
      result = `${slug}-copy-${uniqueSlug}`;
    }
    return result;
  }
  /**
   *
   * @param {string}name
   * @returns {Promise<string>}
   */
  async generateSlugBase(name: string): Promise<string> {
    let slug = convertTitleToSlug(name.trim().toLocaleLowerCase());
    slug = await this.uniqueSlugBase(slug);
    return slug;
  }

  /**
   *
   * @param {string}id
   * @param {string}slug
   * @returns
   */
  async updateSlugBase(id: string, slug: string): Promise<boolean> {
    Logger.log('================== updateSlugBase ==================');
    slug = slug.trim();
    if (!isMongoId(id))
      throw new BadRequestException({ message: 'Id must be MongoId!' });
    if (!isSlug(slug)) {
      throw new BadRequestException({ message: 'Slug invalid!' });
    }
    const docById: any = await this.model.findById(id).exec();
    if (!docById) throw new NotFoundException({ message: 'Post not found!' });

    if (slug === docById?.slug)
      throw new BadRequestException({ message: 'No changes!' });

    const docBySlug = await this.model.findOne({ slug }).exec();
    if (docBySlug)
      throw new NotFoundException({ message: 'Slug already in use!' });

    const update = await this.model.updateOne({ _id: id }, { $set: { slug } });

    return !!update.modifiedCount;
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<boolean>}
   */
  async removeBase(id: string): Promise<boolean> {
    Logger.log('================== removeBase ==================');
    if (!isMongoId(id))
      throw new BadRequestException({
        message: 'ID must be MongoId!',
      });
    const post = await this.model.findById(id);
    if (!post) throw new NotFoundException({ message: 'Post not found!' });
    const result = await this.model.deleteOne({ _id: id });
    return !!result.deletedCount;
  }

  /**
   *
   * @param {RemoveManyDto}ids
   * @returns {Promise<boolean>}
   */
  async removeManyBase({ ids }: RemoveManyDto): Promise<boolean> {
    Logger.log('================== removeManyBase ==================');
    const docIds = Array.isArray(ids)
      ? ids
          .filter((id) => isMongoId(id))
          .map((id) => {
            const idObj = new Types.ObjectId(id);
            return idObj;
          })
      : [];
    if (docIds?.length <= 0) return false;
    const del = await this.model.deleteMany({ _id: docIds });
    return !!del.deletedCount;
  }

  /**
   *
   * @returns {Promise<number>}
   */
  async findTotal(): Promise<number> {
    return await this.model.countDocuments();
  }
}
