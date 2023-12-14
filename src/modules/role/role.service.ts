import { EOrder, EOrderBy } from '@configs/interface.config';
import { ACCESS, CODE_ROLE, ERole } from '@configs/permission.config';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseService } from '@src/base/service/base.service';
import { permissionToFlat } from '@utils/permission.util';
import { isAzUppercaseRegex } from '@utils/string.util';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role, TRoleDocument } from './entities/role.entity';
import { ROLE_ADMIN, ROLE_EDITOR, ROLE_GUEST } from './seed/role.seed';
import { TUserDocument } from '../user/entities/user.entity';
import { checkMongoObjectIds } from '@src/utils/objectId.util';

@Injectable()
export class RoleService extends BaseService<Role> {
  constructor(
    @InjectModel('role') private readonly roleModel: Model<TRoleDocument>,
  ) {
    super(roleModel);
    // Init Role ADMINISTRATOR
    (async () => {
      const roleAdmin = await this.roleModel.findOne({
        code: ERole.ADMINISTRATOR,
      });
      if (!roleAdmin) {
        const newRole = new this.roleModel(plainToInstance(Role, ROLE_ADMIN));
        await newRole.save();
      }

      // Init Role EDITOR
      const roleEditor = await this.roleModel.findOne({ code: ERole.EDITOR });
      if (!roleEditor) {
        const newRole = new this.roleModel(plainToInstance(Role, ROLE_EDITOR));
        await newRole.save();
      }

      // Init Role GUEST
      const roleGuest = await this.roleModel.findOne({ code: ERole.GUEST });
      if (!roleGuest) {
        const newRole = new this.roleModel(plainToInstance(Role, ROLE_GUEST));
        await newRole.save();
      }
      // Add all permission to ADMINISTRATOR
      const role = await this.roleModel.findOne({ code: ERole.ADMINISTRATOR });
      const permissionAll = permissionToFlat();

      if (JSON.stringify(role?.permissions) !== JSON.stringify(permissionAll)) {
        role.permissions = permissionAll;
        await role.save();
      }
    })();
  }

  validation(code: string): void {
    if (!code) throw new BadRequestException('Code Is Required!');
    if (!isAzUppercaseRegex(code))
      throw new BadRequestException('Code Invalid');
    // if (CODE_ROLE.includes(code))
    //   throw new BadRequestException({
    //     message: "Code Not in ['GUEST','EDITOR','ADMINISTRATOR']!",
    //   });
  }

  /**
   *
   * @param user
   * @param permission
   * @returns {Promise<boolean>}
   */
  async checkPermissionByUser(
    user: TUserDocument,
    permission: ACCESS,
  ): Promise<boolean> {
    const roleIds =
      user?.roles?.length > 0
        ? user.roles
            .map((role: TRoleDocument) => role._id.toHexString())
            .filter((r: string) => !!r)
        : [];
    if (roleIds?.length <= 0) return false;

    const rolesCurrent = await this.findAllInIds(roleIds);
    if (rolesCurrent?.length <= 0) return false;

    const permissionCurrent = rolesCurrent
      .map((role) => role.permissions)
      .flat();

    const isValid = permissionCurrent.some((v) => {
      return permission.includes(v);
    });
    return isValid;
  }

  /**
   *
   * @param {CreateRoleDto}body
   * @returns {Promise<TRoleDocument>}
   */
  async create(body: CreateRoleDto): Promise<TRoleDocument> {
    Logger.log('======================= Create Role =======================');
    body = plainToInstance(CreateRoleDto, body, {
      excludeExtraneousValues: true,
    });
    // #1: Check code
    this.validation(body.code);
    const role = await this.findOneByCode(body.code);
    if (role?._id)
      throw new BadRequestException({ message: 'Role code already exists!' });

    // #2: Create role
    const newData = new this.roleModel(body);
    return await newData.save();
  }

  /**
   *
   * @param {QueryRoleDto}query
   * @returns {Promise<{ data: Omit<TRoleDocument, never>[]; total: number }>}
   */
  async findAll(
    query: QueryRoleDto,
  ): Promise<{ data: Omit<TRoleDocument, never>[]; total: number }> {
    Logger.log('======================= List Role =======================');
    query = plainToInstance(QueryRoleDto, query, {
      excludeExtraneousValues: true,
    });
    const {
      page = 1,
      limit = 10,
      s,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
    } = query;
    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];
    const skip = (+page - 1) * +limit;
    const textS = s?.trim();
    const condition = [];
    if (textS) {
      condition.push({
        $or: [
          { code: { $regex: String(textS), $options: 'i' } },
          { description: { $regex: String(textS), $options: 'i' } },
        ],
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
    const data = await this.roleModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .limit(+limit)
      .skip(skip)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.roleModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );
    return { data, total };
  }

  /**
   *
   * @param {string[]}ids
   * @returns {Promise<TRoleDocument[]>}
   */
  async findAllInIds(ids: string[]): Promise<TRoleDocument[]> {
    if (ids?.length <= 0) return [];
    const data = await this.roleModel
      .find()
      .where({
        _id: { $in: ids },
      })
      .exec();
    return data;
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<TRoleDocument>}
   */
  async findOne(id: string): Promise<TRoleDocument> {
    Logger.log('======================= FindOne Role =======================');
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException({ message: 'Id Is Invalid!' });
    const role = await this.roleModel.findById(id).exec();
    if (!role?._id) throw new NotFoundException({ message: 'Role Not Found!' });
    return role;
  }

  /**
   *
   * @param {string}id
   * @param {UpdateRoleDto}body
   * @returns {Promise<boolean>}
   */
  async update(id: string, body: UpdateRoleDto): Promise<boolean> {
    Logger.log('======================= Update Role =======================');
    body = plainToInstance(UpdateRoleDto, body, {
      excludeExtraneousValues: true,
    });
    // #1: check Id
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException({ message: 'Id Is Invalid!' });
    const role = await this.findOne(id);
    if (!role?._id) throw new NotFoundException({ message: 'Role Not Found!' });

    // #2: check code
    if (body?.code && body?.code !== role.code) {
      // Default code 'Guest, EDITOR, ADMINISTRATOR' cannot be edited
      if (CODE_ROLE.includes(role.code)) {
        throw new BadRequestException({
          message:
            "Default code 'Guest, EDITOR, ADMINISTRATOR' cannot be edited!",
        });
      } else {
        this.validation(body.code);
        const roleInvalid = await this.roleModel
          .findOne({ code: body.code })
          .where({ _id: { $ne: role._id } });
        if (roleInvalid?._id)
          throw new BadRequestException({
            message: ' Role code already exists!',
          });
      }
    }

    // #3: Update role by id
    const update = await this.roleModel.updateOne({ _id: id }, { ...body });
    return !!update.modifiedCount;
  }

  /**
   *
   * @param {string}code
   * @returns {Promise<TRoleDocument>}
   */
  async findOneByCode(code: string): Promise<TRoleDocument> {
    Logger.log('=================== FindOne Role By Code ====================');
    const role = await this.roleModel.findOne({ code }).exec();
    return role;
  }
}
