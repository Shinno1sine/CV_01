import { EOrder, EOrderBy } from '@configs/interface.config';
import { TUserDocument } from '@modules/user/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  convertTitleToSlug,
  isAzUppercaseRegex,
  isSlug,
} from '@utils/string.util';
import { isMongoId, isString, isUppercase } from 'class-validator';
import { Model } from 'mongoose';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import { UpdateTaxonomyDto } from './dto/update-taxonomy.dto';
import { Taxonomy, TTaxonomyDocument } from './entities/taxonomy.entity';
import { TAXONOMY_ROOT, TAXONOMY_ROOT_ID } from './seed/taxonomy.seed';
import { QueryTaxonomyDto } from './dto/query-taxonomy.dto';
import { BaseService } from '@src/base/service/base.service';
import { plainToInstance } from 'class-transformer';
import { makeTree } from '@src/utils/make-tree.util';
import { FieldTaxPopulate } from '@src/configs/const.config';
import { checkMongoObjectIds } from '@src/utils/objectId.util';

// Không cho phép update postType trong bất cứ trường hợp nào, Chỉ có thể xoá cây Taxonomy đó và tạo lại câu mới từ đâu
@Injectable()
export class TaxonomyService extends BaseService<Taxonomy> {
  constructor(
    @InjectModel('taxonomy')
    private readonly taxonomyModel: Model<TTaxonomyDocument>,
  ) {
    super(taxonomyModel);
    (async () => {
      const taxonomy = await this.taxonomyModel.findById(TAXONOMY_ROOT_ID);
      if (!taxonomy) {
        const newTaxonomy = new this.taxonomyModel({
          ...TAXONOMY_ROOT,
          nameSort: convertTitleToSlug(TAXONOMY_ROOT.name),
          slug: convertTitleToSlug(TAXONOMY_ROOT.name),
          _id: TAXONOMY_ROOT_ID,
        });
        await newTaxonomy.save();
      }
    })();
  }

  async idValid(
    id: string,
    fieldName = 'ID',
    isRoot = true,
  ): Promise<TTaxonomyDocument> {
    if (!isMongoId(id))
      throw new BadRequestException({
        message: `${fieldName} must be MongoId!`,
      });
    if (id === TAXONOMY_ROOT_ID && isRoot)
      throw new BadRequestException({
        message: `Do not change the root directory!`,
      });
    const taxonomy = await this.taxonomyModel
      .findById(id)
      .populate('parent')
      .exec();
    if (!taxonomy?._id)
      throw new NotFoundException({
        message: `${fieldName} is not exists!`,
      });
    return taxonomy;
  }

  /**
   * Các node lá được tạo ra postType phải giống postType node cha, trừ các node con của Root
   * @param {body}body
   * @param {user}user
   * @returns {Promise<TTaxonomyDocument>}
   */
  async create(
    body: CreateTaxonomyDto,
    user: TUserDocument,
  ): Promise<TTaxonomyDocument> {
    Logger.log('================ Create Taxonomy ================');
    body = plainToInstance(CreateTaxonomyDto, body, {
      excludeExtraneousValues: true,
    });
    const { parentId, name, postType, description } = body;
    // #1: Check parentId
    let parent: TTaxonomyDocument = null;
    if (parentId) {
      // #1.1: Nếu có parentID
      if (!isMongoId(parentId))
        throw new BadRequestException({
          message: 'ParentId must be MongoId!',
        });
      parent = await this.taxonomyModel.findById(parentId);
      if (!parent?._id)
        throw new BadRequestException({
          message: 'Parent taxonomy is not exists!',
        });
      // #1.2: Node con được tạo phải có postType giống postType node cha
      if (parent?.postType !== body.postType)
        throw new BadRequestException({
          message: "postType must be same as parent's postType!",
        });
    } else {
      // #1.2: Không có parentId thì mặc định node được thêm là con của node gốc (root)
      parent = await this.taxonomyModel.findOne({ left: 0 });
      if (!parent?._id)
        throw new NotAcceptableException({
          message:
            'Please create a root directory before adding other subdirectories, the first root directory always has a left value of 0, a right value of 1.',
        });
    }

    const { right: myRight } = parent;
    // #2: Cập nhật left và right của các node có left và right >= myRight
    const lftUpdate = await this.taxonomyModel.updateMany(
      { left: { $gte: myRight } },
      { $inc: { left: 2 } },
    );
    Logger.debug('🚀 ~  TaxonomyService ~ create ~ lftUpdate', lftUpdate);
    const rgtUpdate = await this.taxonomyModel.updateMany(
      { right: { $gte: myRight } },
      { $inc: { right: 2 } },
    );
    Logger.debug('🚀 ~  TaxonomyService ~ create ~ rgtUpdate', rgtUpdate);

    // #3: Generate slug
    const slug = await this.generateSlugBase(name);

    // #3: Tạo bản ghi mới cho node
    const myBody = {
      name,
      parent,
      slug,
      description,
      postType,
      author: user,
      editedBy: user,
      left: myRight + 2 - 1 - 1,
      right: myRight + 2 - 1,
    };
    const newTax = new this.taxonomyModel(myBody);
    const result = await newTax.save();
    Logger.debug('🚀 ~  TaxonomyService ~ create ~ result', result);
    return result;
  }

  /**
   *
   * @param {QueryTaxonomyDto}query
   * @returns {Promise<{ data: TTaxonomyDocument[]; total: number }>}
   */
  async findAll(
    query: QueryTaxonomyDto,
  ): Promise<{ data: TTaxonomyDocument[]; total: number }> {
    Logger.log('======================= List Taxonomy =======================');
    query = plainToInstance(QueryTaxonomyDto, query, {
      excludeExtraneousValues: true,
    });
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
      parentId = TAXONOMY_ROOT_ID,
      isGenealogy = 0,
      postType = null,
      s,
      authorId = null,
    } = query;
    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];

    const skip = (+page - 1) * +limit;
    const condition = [];
    const textS = s?.trim();

    // Bỏ qua taxonomy root (Node cao nhất)
    condition.push({
      left: { $ne: 0 },
    });

    if (textS) {
      condition.push({
        $or: [{ name: { $regex: String(textS), $options: 'i' } }],
      });
    }

    if (parentId) {
      if (!isMongoId(parentId))
        throw new BadRequestException({
          message: 'ParentId must be mongoId!',
        });
      if (isGenealogy === 0) {
        condition.push({
          parent: parentId,
        });
      }
      if (isGenealogy === 1) {
        const parent = await this.taxonomyModel.findById(parentId);
        condition.push({
          left: { $gt: parent.left, $lt: parent.right },
        });
      }
    }

    if (authorId) {
      if (!isMongoId(authorId))
        throw new BadRequestException({
          message: 'AuthorId must be mongoId!',
        });
      condition.push({
        author: authorId,
      });
    }

    if (postType) {
      if (!isAzUppercaseRegex(postType) || !isUppercase(postType))
        throw new BadRequestException({
          message: 'Only uppercase characters are allowed without diacritics!',
        });
      condition.push({
        postType,
      });
    }

    if (notInIds?.length > 0) {
      checkMongoObjectIds(notInIds, 'NotInIds must be [mongoId]');
      condition.push({ _id: { $nin: notInIds } });
    }

    if (inIds?.length > 0) {
      checkMongoObjectIds(inIds, 'InIds must be [mongoId]');
      condition.push({ _id: { $in: inIds } });
    }

    const data = await this.taxonomyModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.taxonomyModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );
    return { data, total };
  }

  /**
   *
   * @param taxonomyId
   * @param postType
   * @returns
   */
  async findAllTaxonomyMakeTree(taxonomyId: string, postType: string) {
    Logger.log('================ Find All Taxonomy Make Tree ================');
    if (!isAzUppercaseRegex(postType) && !isUppercase(postType)) {
      throw new BadRequestException({
        message:
          'PostType Must be contiguous characters without accents, uppercase and no special characters!',
      });
    }

    const root = await this.taxonomyModel
      .findOne({ left: 0 })
      .select('name nameSort slug parent postType description')
      .populate('parent', 'name nameSort')
      .exec();
    if (!root) {
      throw new NotAcceptableException({
        message: 'Data has been corrupted, root folder does not exist!',
      });
    }

    let taxonomies = [];
    if (taxonomyId) {
      if (!isMongoId(taxonomyId))
        throw new BadRequestException({
          message: 'TaxonomyId must be MongoId!',
        });
      const folder = await this.taxonomyModel.findById(taxonomyId);
      if (!folder)
        throw new NotFoundException({ message: 'Taxonomy not found!' });
      taxonomies = await this.taxonomyModel
        .find()
        .sort({ left: 1 })
        .select('name nameSort slug parent postType description')
        .populate('parent', 'name nameSort')
        .where({
          left: { $gte: folder.left },
          right: { $lte: folder.right },
          postType,
        })
        .exec();
      if (taxonomyId === TAXONOMY_ROOT_ID) {
        taxonomies = [root, ...taxonomies];
      }
    } else {
      taxonomies = await this.taxonomyModel
        .find()
        .sort({ left: 1 })
        .select('name nameSort slug parent postType description')
        .populate('parent', 'name nameSort')
        .where({
          postType,
        })
        .exec();
      taxonomies = [root, ...taxonomies];
    }

    if (taxonomies?.length <= 0) return null;

    const taxonomiesMake = taxonomies.map((t) => {
      return {
        _id: t._id.toHexString(),
        name: t.name,
        slug: t.slug,
        nameSort: t.nameSort,
        description: t.description,
        parent: (t.parent as TTaxonomyDocument)?._id?.toHexString() || null,
        text: t.name,
        value: t._id.toHexString(),
      };
    });

    const data = makeTree(taxonomiesMake);

    return data[0];
  }

  /**
   *
   * @param {string[]}ids
   * @returns {Promise<TTaxonomyDocument[]>}
   */
  async findAllInIds(ids: string[]): Promise<TTaxonomyDocument[]> {
    if (ids?.length <= 0) return [];
    const data = await this.taxonomyModel
      .find()
      .where({ _id: { $in: ids }, left: { $ne: 0 } })
      .populate('parent', FieldTaxPopulate)
      .exec();
    return data;
  }

  /**
   *
   * @param {string}id
   * @returns
   */
  async findOne(id: string): Promise<TTaxonomyDocument> {
    Logger.log('================= FindOne Taxonomy ==================');
    if (!isMongoId(id))
      throw new BadRequestException({ message: 'ID must be mongId!' });
    return await this.taxonomyModel
      .findById(id)
      .where({ left: { $ne: 0 } })
      .populate('parent', FieldTaxPopulate)
      .populate('author')
      .exec();
  }

  /**
   *
   * @param {string}slug
   * @returns {Promise<TTaxonomyDocument>}
   */
  async findOneBySlug(slug: string): Promise<TTaxonomyDocument> {
    Logger.log('================= FindOne Taxonomy by Slug ==================');
    if (!isSlug(slug))
      throw new BadRequestException({ message: 'Slug invalid!' });
    return await this.taxonomyModel
      .findOne()
      .where({ slug, left: { $ne: 0 } })
      .populate('parent', FieldTaxPopulate)
      .populate('author')
      .exec();
  }

  /**
   *
   * @param {string}id
   * @param {UpdateTaxonomyDto}body
   * @param {TUserDocument}user
   * @returns {Promise<boolean>}
   */
  async update(
    id: string,
    body: UpdateTaxonomyDto,
    user: TUserDocument,
  ): Promise<boolean> {
    Logger.log('================= Update Taxonomy ==================');
    body = plainToInstance(UpdateTaxonomyDto, body, {
      excludeExtraneousValues: true,
    });
    const taxonomy = await this.idValid(id);
    Logger.debug('🚀 ~ TaxonomyService ~ update ~ taxonomy', taxonomy);

    const { name } = body;

    if (!name)
      throw new BadRequestException({ message: 'Name should not be empty!' });
    if (!isString(name))
      throw new BadRequestException({ message: 'Name must be a string!' });
    if (name.length < 3)
      throw new BadRequestException({
        message: 'Name must be longer than or equal to 3 characters!',
      });
    if (name.length > 191)
      throw new BadRequestException({
        message: 'Name must be shorter than or equal to 30 characters!',
      });

    const result = await this.taxonomyModel.updateOne(
      { _id: id },
      {
        ...body,
        editedBy: user,
      },
    );
    return !!result?.modifiedCount;
  }

  /**
   *
   * @param {number}lft
   * @param {number}rgt
   * @returns {Promise<TTaxonomyDocument[]>}
   */
  async findAllTaxChildrenInGenealogyByLR(
    lft: number,
    rgt: number,
  ): Promise<TTaxonomyDocument[]> {
    Logger.log(
      '==== FindAll Taxonomy Children In Genealogy By Left and Right ====',
    );
    if (lft >= rgt)
      throw new BadRequestException({
        message: 'The lft value must be less than the rgt value.',
      });
    const taxonomy = await this.taxonomyModel.find({
      left: { $gt: lft, $lt: rgt },
    });
    return taxonomy;
  }

  /**
   *
   * @param {string}id
   */
  async remove(id: string) {
    Logger.log('=================== Remove Taxonomy ==================');
    const taxonomy = await this.idValid(id);

    const myRight = taxonomy.right;
    const myLeft = taxonomy.left;
    const myWith = myRight - myLeft + 1;

    const result = await this.taxonomyModel.deleteMany({
      left: { $gte: myLeft, $lte: myRight },
    });
    if (result.deletedCount) {
      const leftUpdate = await this.taxonomyModel.updateMany(
        { left: { $gt: myRight } },
        { $inc: { left: -myWith } },
      );
      Logger.debug('🚀 ~ TaxonomyService ~ remove ~ leftUpdate', leftUpdate);
      const rightUpdate = await this.taxonomyModel.updateMany(
        { right: { $gt: myRight } },
        { $inc: { right: -myWith } },
      );
      Logger.debug('🚀 ~ TaxonomyService ~ remove ~ rightUpdate', rightUpdate);
    }
    return !!result.deletedCount;
  }

  /**
   * Không thể move các node con vào cây có postType khác postType của node đó
   * @param id
   * @param user
   * @param newParentId
   * @returns
   */
  async move(
    id: string,
    user: TUserDocument,
    newParentId: string,
  ): Promise<boolean> {
    Logger.log('================ Moving Taxonomy =================');
    if (id === newParentId)
      throw new BadRequestException({
        message: 'parent directory id must be different from subdirectory id!',
      });
    const taxonomy = await this.idValid(id);

    let newParent: TTaxonomyDocument = null;
    if (newParentId) {
      if (
        newParentId === (taxonomy.parent as TTaxonomyDocument)._id.toHexString()
      )
        throw new BadRequestException({
          message: "parent id doesn't see any change from the old record!",
        });

      newParent = await this.idValid(newParentId, 'newParentId', false);

      if (
        newParent.postType !== taxonomy.postType &&
        newParentId !== TAXONOMY_ROOT_ID
      )
        throw new BadRequestException({
          message: 'PostType inconsistency!',
        });
    } else {
      newParent = await this.taxonomyModel.findOne({ left: 0 });
      if (!newParent?._id)
        throw new NotAcceptableException({
          message:
            'Please create a root directory before adding other subdirectories, the first root directory always has a left value of 0, a right value of 1.',
        });
    }

    const newLeft = newParent.right;
    const oldRight = taxonomy.right;
    const myLeft = taxonomy.left;
    const myRight = taxonomy.right;
    const myWith = myRight - myLeft + 1; // Kích thước cây con
    let distance = newLeft - myLeft; // Khoảng cách từ vị trí mới đến vị trí cũ của cây con
    let tmp = myLeft; // được sử dụng để theo dõi cây con được di chuyển trong quá trình cập nhật

    if (distance < 0) {
      distance -= myWith;
      tmp += myWith;
    }

    await this.taxonomyModel.updateMany(
      {
        left: { $gte: newLeft },
      },
      {
        $inc: { left: myWith },
      },
    );

    await this.taxonomyModel.updateMany(
      {
        right: { $gte: newLeft },
      },
      {
        $inc: { right: myWith },
      },
    );

    const update = await this.taxonomyModel.updateMany(
      { $and: [{ left: { $gte: tmp } }, { right: { $lt: tmp + myWith } }] },
      {
        $inc: { left: distance, right: distance },
        $set: { editedBy: user },
      },
    );

    await this.taxonomyModel.updateOne({ _id: id }, { parent: newParent });

    await this.taxonomyModel.updateMany(
      {
        left: { $gt: oldRight },
      },
      { $inc: { left: -myWith } },
    );

    await this.taxonomyModel.updateMany(
      {
        right: { $gt: oldRight },
      },
      { $inc: { right: -myWith } },
    );

    return !!update?.modifiedCount;
  }
}
