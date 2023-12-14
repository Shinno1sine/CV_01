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
import { convertTitleToSlug } from '@utils/string.util';
import { Model, Types } from 'mongoose';
import { CreateFolderDto } from './dto/create-media.dto';
import { QueryFileDto, QueryFolderDto } from './dto/query-media.dto';
import {
  MoveFileDto,
  // ResizeImageDto,
  UpdateFileDto,
  UpdateFolderDto,
} from './dto/update-media.dto';
import { Folder, TFolderDocument } from './entities/folder.entity';
import { FileUploadHelper } from './helpers/file-upload';
import { EMediaSystem } from './media.interface';
import { FOLDER_ROOT, FOLDER_ROOT_ID } from './seed/folder.seed';
import { AwsS3Helper, S3Media } from './helpers/aws-s3';
import { File, TFileDocument } from './entities/file.entity';
import { isMongoId } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { makeTreeFolder } from './helpers/make-tree';
import { checkMongoObjectIds } from '@src/utils/objectId.util';
import { FieldAuthorPopulate } from '@src/configs/const.config';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel('folder')
    private readonly folderModel: Model<TFolderDocument>,
    @InjectModel('file')
    private readonly fileModel: Model<TFileDocument>,
  ) {
    // Init folder root
    (async () => {
      const folder = await this.folderModel.findById(FOLDER_ROOT_ID);
      if (!folder) {
        const newFolder = new this.folderModel({
          ...FOLDER_ROOT,
          nameSort: convertTitleToSlug(FOLDER_ROOT.name),
          _id: FOLDER_ROOT_ID,
        });
        await newFolder.save();
      }
    })();
  }

  // [START] - Folder Service

  async idValid(id: string, fieldName = 'ID', isRoot = true) {
    if (!isMongoId(id))
      throw new BadRequestException({
        message: `${fieldName} must be MongoId!`,
      });

    if (id === FOLDER_ROOT_ID && isRoot)
      throw new BadRequestException({
        message: `Do not change the root directory!`,
      });

    const folder = await this.folderModel
      .findById(id)
      .populate('parent')
      .exec();
    if (!folder?._id)
      throw new NotFoundException({
        message: `${fieldName} is not exists!`,
      });
    return folder;
  }

  /**
   * @description Thêm 1 node con, là con của 1 node đã có
   * @param {CreateFolderDto}body
   * @param {TUserDocument}user
   * @returns {Promise<TFolderDocument>}
   */
  async createFolder(
    body: CreateFolderDto,
    user: TUserDocument,
  ): Promise<Promise<TFolderDocument>> {
    Logger.log('======================= Create Folder =======================');
    body = plainToInstance(CreateFolderDto, body, {
      excludeExtraneousValues: true,
    });
    const { parentId } = body;
    // #1: Check parentId
    let parent: TFolderDocument = null;
    if (parentId) {
      // #1.1: Nếu có parentId
      parent = await this.idValid(parentId, 'ParentId');
    } else {
      // #1.2: Không có parentId thì mặc định node được thêm là con của node gốc (root)
      parent = await this.folderModel.findOne({ left: 0 });
      if (!parent?._id)
        throw new NotAcceptableException({
          message:
            'Please create a root directory before adding other subdirectories, the first root directory always has a left value of 0, a right value of 1.',
        });
    }

    const { right: myRight } = parent;
    // #2: Cập nhật left và right của các node có left và right >= myRight
    const lftUpdate = await this.folderModel.updateMany(
      { left: { $gte: myRight } },
      { $inc: { left: 2 } },
    );
    Logger.debug('🚀 ~ MediaService ~ createFolder ~ lftUpdate', lftUpdate);
    const rgtUpdate = await this.folderModel.updateMany(
      { right: { $gte: myRight } },
      { $inc: { right: 2 } },
    );
    Logger.debug('🚀 ~ MediaService ~ createFolder ~ rgtUpdate', rgtUpdate);

    // #3: Tạo bản ghi mới cho node
    const myBody: Folder = {
      name: body.name,
      nameSort: convertTitleToSlug(body.name),
      parent,
      author: user,
      editedBy: user,
      left: myRight + 2 - 1 - 1,
      right: myRight + 2 - 1,
    };
    const newFolder = new this.folderModel(myBody);
    const result = await newFolder.save();
    Logger.debug('🚀 ~  MediaService ~ createFolder ~ result', result);
    return result;
  }

  /**
   *
   * @param {QueryFolderDto}query
   * @returns {Promise<{ data: TFolderDocument[]; total: number }>}
   */
  async findAllFolder(
    query: QueryFolderDto,
  ): Promise<{ data: TFolderDocument[]; total: number }> {
    Logger.log('======================= List Folder =======================');
    query = plainToInstance(QueryFolderDto, query, {
      excludeExtraneousValues: true,
    });
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
      parentId = FOLDER_ROOT_ID,
      isGenealogy = 0,
      s,
    } = query;

    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];

    const skip = (+page - 1) * +limit;
    const condition = [];
    const textS = s?.trim();

    // Bỏ qua folder root (Node cao nhất)
    condition.push({
      left: { $ne: 0 },
    });

    if (textS) {
      condition.push({
        $or: [{ name: { $regex: String(textS), $options: 'i' } }],
      });
    }

    if (parentId) {
      if (!Types.ObjectId.isValid(parentId))
        throw new BadRequestException({
          message: 'ParentId must be mongoId!',
        });
      if (isGenealogy === 0) {
        condition.push({
          parent: parentId,
        });
      }
      if (isGenealogy === 1) {
        const parent = await this.folderModel.findById(parentId);
        condition.push({
          left: { $gt: parent.left, $lt: parent.right },
        });
      }
    }

    if (notInIds?.length > 0) {
      checkMongoObjectIds(notInIds, 'NotInIds must be [mongoId]');
      condition.push({ _id: { $nin: notInIds } });
    }

    if (inIds?.length > 0) {
      checkMongoObjectIds(inIds, 'InIds must be [mongoId]');
      condition.push({ _id: { $in: inIds } });
    }

    const data = await this.folderModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .populate('parent', 'name nameSort')
      .exec();

    const total = await this.folderModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );
    return { data, total };
  }

  /**
   * @param {string}folderId
   * @returns {Promise<TFolderDocument[]>}
   */

  async findAllFolderMakeTree(
    folderId: string,
  ): Promise<TFolderDocument & { children: any[] }> {
    Logger.log('================ Find All Folder Make Tree ================');
    let folders = [];
    if (folderId) {
      if (!isMongoId(folderId))
        throw new BadRequestException({ message: 'FolderId must be MongoId!' });
      const folder = await this.folderModel.findById(folderId);
      if (!folder)
        throw new NotFoundException({ message: 'Folder not found!' });
      folders = await this.folderModel
        .find()
        .sort({ left: 1 })
        .select('name nameSort parent')
        .populate('parent', 'name nameSort')
        .where({
          left: { $gte: folder.left },
          right: { $lte: folder.right },
        })
        .exec();
    } else {
      folders = await this.folderModel
        .find()
        .sort({ left: 1 })
        .select('name nameSort parent')
        .populate('parent', 'name nameSort')
        .exec();
    }

    if (folders?.length <= 0) return null;

    const foldersMake = folders.map((f) => {
      return {
        _id: f._id.toHexString(),
        name: f.name,
        nameSort: f.nameSort,
        parent: (f.parent as TFolderDocument)?._id?.toHexString() || null,
      };
    });

    const data = makeTreeFolder(foldersMake);
    return data[0];
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<TFolderDocument> }
   */
  async findOneFolder(id: string): Promise<TFolderDocument> {
    Logger.log('===================== FindOne Folder =====================');
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException({ message: 'ID must be mongId!' });
    const folder = await this.folderModel
      .findById(id)
      .where({ left: { $ne: 0 } })
      .populate('parent')
      .populate('author')
      .exec();
    if (!folder?._id)
      throw new NotFoundException({ message: 'Folder Not Found!' });

    return folder;
  }

  async getPathToNode(
    folder: TFolderDocument,
  ): Promise<{ _id: Types.ObjectId; name: string }[]> {
    const ancestors = await this.folderModel
      .find({ left: { $lt: folder.left }, right: { $gt: folder.right } })
      .sort({ left: 1 });

    const path = ancestors.map((item) => {
      return {
        _id: item._id,
        name: item.name,
      };
    });
    return [...path, { _id: folder._id, name: folder.name }];
  }

  /**
   *
   * @param {string}id
   * @param {UpdateFolderDto}body
   * @param {TUserDocument}user
   * @returns {Promise<boolean>}
   */
  async updateFolder(
    id: string,
    body: UpdateFolderDto,
    user: TUserDocument,
  ): Promise<boolean> {
    Logger.log('======================= Update Folder =======================');
    body = plainToInstance(UpdateFolderDto, body, {
      excludeExtraneousValues: true,
    });
    // #1: Check folder exist as isValid mongoId
    const folder = await this.idValid(id);
    Logger.debug('🚀 ~ MediaService ~ updateFolder ~ folder', folder);

    // #2: Update folder
    const { name } = body;
    // #2.1: validator Name
    if (!name)
      throw new BadRequestException({ message: 'Name should not be empty!' });
    if (typeof name !== 'string')
      throw new BadRequestException({ message: 'Name must be a string!' });
    if (name.length < 3)
      throw new BadRequestException({
        message: 'Name must be longer than or equal to 3 characters!',
      });
    if (name.length > 30)
      throw new BadRequestException({
        message: 'Name must be shorter than or equal to 30 characters!',
      });
    // #2.2: UPDATE
    const result = await this.folderModel.updateOne(
      { _id: id },
      {
        name,
        nameSort: convertTitleToSlug(name),
        editedBy: user._id,
      },
    );
    return !!result.modifiedCount;
  }

  /**
   *
   * @param {string}id
   * @param {string}newParentId
   * @param {TUserDocument}user
   * @returns {Promise<boolean>}
   */
  async moveFolder(
    id: string,
    user: TUserDocument,
    newParentId?: string,
  ): Promise<boolean> {
    Logger.log('======================= Moving Folder =======================');
    if (id === newParentId)
      throw new BadRequestException({
        message: 'parent directory id must be different from subdirectory id!',
      });
    // #1: Check folder exist as isValid mongoId
    const folder = await this.idValid(id);
    Logger.debug('🚀 ~ MediaService ~ moveFolder ~ folder', folder);

    // #2: Check Folder Parent
    let newParent: TFolderDocument = null;
    if (newParentId) {
      if (newParentId === (folder.parent as TFolderDocument)._id.toHexString())
        throw new BadRequestException({
          message: "Parent id doesn't see any change from the old record!",
        });
      // #1.1: Nếu có newParentId
      newParent = await this.idValid(newParentId, 'newParentId', false);
    } else {
      // #1.2: Không có newParentId thì mặc định node được thêm là con của node gốc (root)
      newParent = await this.folderModel.findOne({ left: 0 });
      if (!newParent?._id)
        throw new NotAcceptableException({
          message:
            'Please create a root directory before adding other subdirectories, the first root directory always has a left value of 0, a right value of 1.',
        });
    }

    // #3: Moving folder

    // #3.1: Tính toán các biến điều chỉnh vị trí
    const newLeft = newParent.right;

    const oldRight = folder.right;
    const myLeft = folder.left;
    const myRight = folder.right;
    const myWith = myRight - myLeft + 1; // Kích thước cây con
    let distance = newLeft - myLeft; // Khoảng cách từ vị trí mới đến vị trí cũ của cây con
    let tmp = myLeft; // được sử dụng để theo dõi cây con được di chuyển trong quá trình cập nhật

    // #3.2: Chuyển động lùi phải chiếm không gian mới
    if (distance < 0) {
      distance -= myWith;
      tmp += myWith;
    }

    /**
     * [TODO] MongoError: Transaction numbers are only allowed on a replica set member or mongos
     */
    // const session = await this.folderModel.startSession();
    // session.startTransaction();
    // try {
    //   const opts = { session, returnOriginal: false };
    //   // #3.3: Tạo không gian mới cho cây con
    //   // Tăng left của các node  có left >= newLeft một khoảng bằng myWith
    //   const leftCreate = await this.folderModel.updateMany(
    //     {
    //       left: { $gte: newLeft },
    //     },
    //     {
    //       $inc: { left: myWith },
    //     },
    //     opts,
    //   );
    //   Logger.debug('🚀 ~ MediaService ~ moveFolder ~ leftCreate', leftCreate);
    //   // Tăng right của các node  có right >= newLeft một khoảng bằng myWith
    //   const rightCreate = await this.folderModel.updateMany(
    //     {
    //       right: { $gte: newLeft },
    //     },
    //     {
    //       $inc: { right: myWith },
    //     },
    //     opts,
    //   );
    //   Logger.debug(
    //     '🚀 ~ MediaService ~ moveFolder ~  rightCreate',
    //     rightCreate,
    //   );
    //   if (!leftCreate.modifiedCount || !rightCreate.modifiedCount) return false;

    //   // #3.4: Di chuyển cây con vào không gian mới và cập nhật parent mới cho cây con
    //   const update = await this.folderModel.updateMany(
    //     { $and: [{ left: { $gte: tmp } }, { right: { $lt: tmp + myWith } }] },
    //     { $inc: { left: distance, right: distance }, $set: { editedBy: user } },
    //     opts,
    //   );
    //   if (!update.modifiedCount) return false;

    //   // #3.5: Xoá không gian cũ bị bỏ chống bởi cây con
    //   const leftDel = await this.folderModel.updateMany(
    //     {
    //       left: { $gt: oldRight },
    //     },
    //     { $inc: { left: -myWith } },
    //     opts,
    //   );
    //   console.log('🚀 ~ MediaService ~ moveFolder ~ leftDel', leftDel);
    //   const rightDel = await this.folderModel.updateMany(
    //     {
    //       right: { $gt: oldRight },
    //     },
    //     { $inc: { right: -myWith } },
    //     opts,
    //   );
    //   console.log('🚀 ~ MediaService ~ moveFolder ~ rightDel', rightDel);
    //   if (!leftDel.modifiedCount || !rightDel.modifiedCount) return false;

    //   await session.commitTransaction();
    //   session.endSession();
    //   return true;
    // } catch (error) {
    //   Logger.error('🚀 ~ MediaService ~ moveFolder ~ error', error);
    //   await session.abortTransaction();
    //   session.endSession();
    //   throw new BadRequestException({
    //     message: error?.massage || 'There was an error updating the data!',
    //   });
    // }
    // ===================================================

    // Tăng left của các node  có left >= newLeft một khoảng bằng myWith

    const leftCreate = await this.folderModel.updateMany(
      {
        left: { $gte: newLeft },
      },
      {
        $inc: { left: myWith },
      },
    );
    Logger.debug('🚀 ~ MediaService ~ moveFolder ~ leftCreate', leftCreate);
    // Tăng right của các node  có right >= newLeft một khoảng bằng myWith
    const rightCreate = await this.folderModel.updateMany(
      {
        right: { $gte: newLeft },
      },
      {
        $inc: { right: myWith },
      },
    );

    Logger.debug('🚀 ~ MediaService ~ moveFolder ~  rightCreate', rightCreate);

    // #3.4: Di chuyển cây con vào không gian mới và cập nhật parent mới cho cây con
    const update = await this.folderModel.updateMany(
      { $and: [{ left: { $gte: tmp } }, { right: { $lt: tmp + myWith } }] },
      {
        $inc: { left: distance, right: distance },
        $set: { editedBy: user },
      },
    );
    Logger.debug('🚀 ~ MediaService ~ moveFolder ~ update', update);

    // #3.5: Update parentId cho folder vừa ms thay đỏi vị trí trong cây
    const updateParent = await this.folderModel.updateOne(
      { _id: id },
      { parent: newParent },
    );
    Logger.debug('🚀 ~ MediaService ~ moveFolder ~ updateParent', updateParent);

    // #3.6: Xoá không gian cũ bị bỏ trống bởi cây con
    const leftDel = await this.folderModel.updateMany(
      {
        left: { $gt: oldRight },
      },
      { $inc: { left: -myWith } },
    );
    Logger.debug('🚀 ~ MediaService ~ moveFolder ~ leftDel', leftDel);
    const rightDel = await this.folderModel.updateMany(
      {
        right: { $gt: oldRight },
      },
      { $inc: { right: -myWith } },
    );
    Logger.debug('🚀 ~ MediaService ~ moveFolder ~ rightDel', rightDel);

    return !!update.modifiedCount;
  }

  /**
   *
   * @param {number}lft
   * @param {number}rgt
   * @returns {Promise<TFolderDocument[]>}
   */
  async findAllFolderChildrenInGenealogyByLR(
    lft: number,
    rgt: number,
  ): Promise<TFolderDocument[]> {
    Logger.log(
      '==== FindAll Folder Children In Genealogy By Left and Right ====',
    );
    if (lft >= rgt)
      throw new BadRequestException({
        message: 'The lft value must be less than the rgt value.',
      });
    const folders = await this.folderModel.find({
      left: { $gt: lft, $lt: rgt },
    });
    return folders;
  }

  /**
   *
   * @param {string}id
   * @returns
   */
  async removeFolder(id: string): Promise<boolean> {
    Logger.log('======================= Remove Folder =======================');

    // #1: Check folder exist as isValid mongoId
    const folder = await this.idValid(id);
    Logger.debug('🚀 ~ MediaService ~ removeFolder ~ folder', folder);

    const myRight = folder.right;
    const myLeft = folder.left;
    const myWith = myRight - myLeft + 1;
    // #2: Remove Folder and [TODO] - Remove file in folder
    const childrenInGenealogy = await this.findAllFolderChildrenInGenealogyByLR(
      myLeft,
      myRight,
    );
    Logger.debug(
      '🚀 ~ MediaService ~ removeFolder ~ childrenInGenealogy',
      childrenInGenealogy,
    );
    const result = await this.folderModel.deleteMany({
      left: { $gte: myLeft, $lte: myRight },
    });

    if (result.deletedCount) {
      // #2.1: Update left, right các node left, right > myRight
      const leftUpdate = await this.folderModel.updateMany(
        { left: { $gt: myRight } },
        { $inc: { left: -myWith } },
      );
      Logger.debug('🚀 ~ MediaService ~ removeFolder ~ leftUpdate', leftUpdate);
      const rightUpdate = await this.folderModel.updateMany(
        { right: { $gt: myRight } },
        { $inc: { right: -myWith } },
      );
      Logger.debug(
        '🚀 ~ MediaService ~ removeFolder ~ rightUpdate',
        rightUpdate,
      );

      // #2.2: Delete all file children
      const childrenInGenealogyIds =
        childrenInGenealogy?.length > 0
          ? childrenInGenealogy.map((item) => item._id.toHexString())
          : [];

      const files = await this.findAllFileByFolderIds([
        ...childrenInGenealogyIds,
        folder._id.toHexString(),
      ]);
      if (files?.length > 0) {
        const fileIds = files.map((f) => f._id.toHexString());
        await this.removeManyFile(fileIds);
      }
    }
    return !!result.deletedCount;
  }
  // [END] - Folder Service

  // [START] - File Service
  /**
   *
   * @param {Express.Multer.File}file
   * @param { boolean }isWebp
   * @returns {Promise<S3Media>}
   */
  async fileUploadS3(
    file: Express.Multer.File,
    isWebp: boolean,
  ): Promise<S3Media> {
    Logger.log('==================== File Upload S3 ====================');
    const { fileBuffer, filename } =
      await FileUploadHelper.customFileBeforeUpload(file, isWebp);
    const uploadS3 = await AwsS3Helper.uploadS3(fileBuffer, filename);
    return uploadS3;
  }

  /**
   *
   * @param {Array<Express.Multer.File>}files
   * @param user
   * @param isWebp
   * @param folderId
   * @returns
   */
  async filesUploadInsertMediaS3(
    files: Array<Express.Multer.File>,
    user: TUserDocument,
    isWebp: boolean,
    folderId?: string | undefined,
  ): Promise<TFileDocument[] | TFileDocument> {
    // #1: Valid files
    FileUploadHelper.validationFilesBeforeUpload(files);

    // #2: Upload file
    let data: TFileDocument[] | TFileDocument = [];
    data = await Promise.all(
      files.map(async (f) => {
        try {
          const upload = await this.fileUploadInsertMediaS3(
            f,
            {
              isWebp: !!isWebp,
              folderId,
            },
            user,
          );
          if (upload) {
            return upload;
          }

          return null;
        } catch (error) {
          return null;
        }
      }),
    );
    data = data.filter((e) => !!e);
    if (data.length === 1) {
      data = data.pop();
    }
    return data;
  }

  /**
   *
   * @param {Express.Multer.File}file
   * @param {{ isWebp: boolean, folderId: string }}param1
   * @param {TUserDocument}user
   * @return {Promise<TFileDocument>}
   */
  async fileUploadInsertMediaS3(
    file: Express.Multer.File,
    { isWebp, folderId }: { isWebp: boolean; folderId?: string },
    user: TUserDocument,
  ): Promise<TFileDocument> {
    Logger.log('============ File Upload & Insert Media S3 =========');
    // #1: Valid files
    FileUploadHelper.validationFileBeforeUpload(file);

    // #2: Valid folderId
    let folder: TFolderDocument = null;
    if (folderId) {
      folder = await this.folderModel.findById(folderId);
      if (!folder)
        throw new BadRequestException({ message: 'Folder is not exists!' });
    }

    // #3: Custom file after upload
    const { fileBuffer, filename, originalname, width, height, size, format } =
      await FileUploadHelper.customFileBeforeUpload(file, isWebp);

    // #4: Upload s3
    const uploadS3 = await AwsS3Helper.uploadS3(fileBuffer, filename);

    // #5: Create file upload to mongo
    if (uploadS3) {
      const { Location, Key, Bucket } = uploadS3;
      const body: File = {
        name: filename,
        originalname,
        size,
        extension: format,
        mimetype: file.mimetype,
        bucket: Bucket,
        location: Location,
        key: Key,
        width,
        height,
        alt: null,
        caption: null,
        description: null,
        author: user,
        editedBy: user,
        system: EMediaSystem.S3,
        folder,
      };
      const data = new this.fileModel(body);
      const newFile = await data.save();
      return newFile;
    } else {
      return null;
    }
  }

  /**
   *
   * @param {QueryFileDto}query
   * @returns {Promise<{ data: TFileDocument[]; total: number }>}
   */
  async findAllFile(
    query: QueryFileDto,
  ): Promise<{ data: TFileDocument[]; total: number }> {
    query = plainToInstance(QueryFileDto, query, {
      excludeExtraneousValues: true,
    });
    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
      s,
      folderId = null,
    } = query;
    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];

    const skip = (+page - 1) * +limit;
    const condition = [];
    const textS = s?.trim();

    if (textS) {
      condition.push({
        $or: [
          { name: { $regex: String(textS), $options: 'i' } },
          { originalname: { $regex: String(textS), $options: 'i' } },
        ],
      });
    }

    if (folderId) {
      if (!Types.ObjectId.isValid(folderId))
        throw new BadRequestException({
          message: 'FolderId must be mongoId!',
        });
      condition.push({
        folder: folderId,
      });
    } else {
      condition.push({
        folder: null,
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

    const data = await this.fileModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .populate('folder', 'name nameSort')
      .populate('author', FieldAuthorPopulate)
      .exec();

    const total = await this.fileModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );

    return { data, total };
  }

  /**
   *
   * @param {string[]}folderIds
   * @returns {Promise<TFileDocument[]>}
   */
  async findAllFileByFolderIds(folderIds: string[]): Promise<TFileDocument[]> {
    const data = await this.fileModel
      .find({ folder: { $in: folderIds } })
      .exec();
    return data;
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<TFileDocument>}
   */
  async findOneFile(id: string): Promise<TFileDocument> {
    Logger.log('============ Find one file by Id =========');
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException({ message: 'ID must be mongId!' });
    const file = await this.fileModel
      .findById(id)
      .populate('folder', 'name nameSort')
      .populate('author', FieldAuthorPopulate)
      .exec();
    return file;
  }

  /**
   *
   * @param {string[]}ids
   * @returns {Promise<TFileDocument[]>}
   */
  async findAllInIds(ids: string[]): Promise<TFileDocument[]> {
    if (ids?.length <= 0) return [];
    const idsValid = ids.filter((id) => isMongoId(id));

    if (idsValid?.length <= 0) return [];

    const data = await this.fileModel
      .find()
      .where({ _id: { $in: ids } })
      .exec();
    return data;
  }

  /**
   *
   * @param {string}id
   * @param {UpdateFileDto}body
   * @param {TUserDocument}user
   * @returns {Promise<boolean>}
   */
  async updateFile(
    id: string,
    body: UpdateFileDto,
    user: TUserDocument,
  ): Promise<boolean> {
    Logger.log('============ Update file by Id =========');
    body = plainToInstance(UpdateFileDto, body, {
      excludeExtraneousValues: true,
    });
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException({ message: 'ID must be mongId!' });

    const file = await this.findOneFile(id);
    if (!file) throw new NotFoundException({ message: 'File not found!' });

    const update = await this.fileModel.updateOne(
      { _id: id },
      { ...body, editedBy: user },
    );

    return !!update.modifiedCount;
  }

  /**
   *
   * @param {string}id
   * @param {MoveFileDto}body
   * @returns {Promise<boolean>}
   */
  async moveFile(id: string, body: MoveFileDto): Promise<boolean> {
    Logger.log('=================== Move file by Id ====================');
    const { folderId = undefined } = body;
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException({ message: 'ID must be mongId!' });

    const file = await this.fileModel.findById(id).populate('folder');
    if (!file) throw new NotFoundException({ message: 'File not found!' });
    const folderCurrent: TFolderDocument = file.folder as TFolderDocument;
    if (folderCurrent?._id?.toHexString() === folderId)
      throw new BadRequestException({
        message:
          'The destination directory is the same as the current directory!',
      });
    let folder: TFolderDocument = null;
    if (folderId) {
      if (!Types.ObjectId.isValid(folderId))
        throw new BadRequestException({ message: 'FolderId must be mongId!' });

      folder = await this.findOneFolder(folderId);
      if (!folder)
        throw new NotFoundException({ message: 'Folder not found!' });
    }

    const update = await this.fileModel.updateOne({ _id: id }, { folder });

    return !!update.modifiedCount;
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<boolean>}
   */
  async removeFile(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException({ message: 'ID must be mongId!' });

    const file = await this.findOneFile(id);
    if (!file) throw new NotFoundException({ message: 'File not found!' });

    let result = false;
    await this.fileModel
      .deleteOne({ _id: id })
      .then(async (res) => {
        if (!!res.deletedCount) {
          await AwsS3Helper.deleteS3(file);
          result = true;
        } else {
          result = false;
        }
      })
      .catch((error) => {
        Logger.error('🚀 ~ MediaService ~ deleteFile ~ error', error);
        result = false;
      });
    return result;
  }

  /**
   *
   * @param {string[]}ids
   * @returns {Promise<boolean>}
   */
  async removeManyFile(ids: string[]): Promise<boolean> {
    const docIds = Array.isArray(ids)
      ? ids
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => {
            const idObj = new Types.ObjectId(id);
            return idObj;
          })
      : [];
    if (docIds?.length <= 0)
      throw new BadRequestException({ message: 'Id must be mongoId!' });
    const files = await this.fileModel.find({ _id: { $in: ids } });
    if (!files || files?.length <= 0)
      throw new BadRequestException({ message: 'Files is not exists!' });

    let result = false;
    await this.fileModel
      .deleteMany({ _id: docIds })
      .then(async (res) => {
        if (!!res.deletedCount) {
          await AwsS3Helper.deleteManyS3(files);
          result = true;
        } else {
          result = false;
        }
      })
      .catch((error) => {
        Logger.error('🚀 ~ MediaService ~ deleteFile ~ error', error);
        result = false;
      });

    return result;
  }

  // async resizeImage(id: string, body: ResizeImageDto, user: TUserDocument) {
  //   Logger.log('============ Resize file by Id =========');
  //   if (!Types.ObjectId.isValid(id))
  //     throw new BadRequestException({ message: 'ID must be mongId!' });

  //   const file = await this.findOneFile(id);
  //   if (!file) throw new NotFoundException({ message: 'File not found!' });
  // }
  // [END] - File Service
}
