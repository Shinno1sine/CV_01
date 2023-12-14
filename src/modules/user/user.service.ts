import { EOrder, EOrderBy } from '@configs/interface.config';
import { ERole } from '@configs/permission.config';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { TRoleDocument } from '@modules/role/entities/role.entity';
import { RoleService } from '@modules/role/role.service';
import { MediaService } from '@modules/media/media.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseService } from '@src/base/service/base.service';
import { isPwdStrong, isUsername } from '@utils/string.util';
import { plainToInstance } from 'class-transformer';
import { isMongoId } from 'class-validator';
import { Model, Types } from 'mongoose';
import { PasswordService } from 'src/base/service/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TUserDocument, User } from './entities/user.entity';
import { USER_ADMIN } from './seed/user.seed';
import { TFileDocument } from '../media/entities/file.entity';
import { checkMongoObjectIds, mongoObjectIds } from '@src/utils/objectId.util';
import { FieldFilePopulate } from '@src/configs/const.config';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @InjectModel('user') private readonly userModel: Model<TUserDocument>,
    private roleService: RoleService,
    private passwordService: PasswordService,
    private mediaService: MediaService,
  ) {
    super(userModel);
    // Init user admin
    (async () => {
      const user = await this.userModel.findOne({
        username: USER_ADMIN.username,
      });
      if (!user) {
        const rolesUser: TRoleDocument[] = [];
        const roleAdmin = await roleService.findOneByCode(ERole.ADMINISTRATOR);
        if (roleAdmin) rolesUser.push(roleAdmin);
        if (rolesUser?.length > 0) {
          const newUser = new this.userModel({
            ...USER_ADMIN,
            roles: rolesUser,
          });
          await newUser.save();
        }
      }
    })();
  }

  /**
   *
   * @param {CreateUserDto}body
   * @returns {Promise<TUserDocument>}
   */
  async create(body: CreateUserDto): Promise<TUserDocument> {
    body = plainToInstance(CreateUserDto, body, {
      excludeExtraneousValues: true,
    });
    const { username, roles, avatar } = body;

    // #1: Valid/Check username unique
    if (!isUsername(username))
      throw new BadRequestException({ message: 'Username invalid!' });
    const userByUsername = await this.userModel.findOne({ username });
    if (userByUsername?._id)
      throw new BadRequestException({ message: 'Username already exists!' });

    // #2: Init role
    let rolesUser: TRoleDocument[] = [];
    if (!roles || roles?.length <= 0) {
      const roleGuest = await this.roleService.findOneByCode(ERole.GUEST);
      if (roleGuest) rolesUser.push(roleGuest);
    }
    if (roles && roles?.length > 0) {
      rolesUser = await this.roleService.findAllInIds(roles);
    }

    if (rolesUser?.length <= 0)
      throw new NotImplementedException({
        message: 'Default role should be GUEST!',
      });

    // #3: Init avatar
    let avatarUser: TFileDocument = null;
    if (avatar && isMongoId(avatar)) {
      avatarUser = await this.mediaService.findOneFile(avatar);
    }

    // #4: Create user
    const newUser = new this.userModel({
      ...body,
      roles: rolesUser,
      avatar: avatarUser,
    });
    const result = await newUser.save();
    Logger.debug('🚀 ~ UserService ~ create ~ result', result);
    return result;
  }

  /**
   *
   * @param {QueryUserDto}query
   * @returns {Promise<{ data: Omit<TUserDocument, never>[]; total: number; }>}
   */
  async findAll(query: QueryUserDto): Promise<{
    data: Omit<TUserDocument, never>[];
    total: number;
  }> {
    query = plainToInstance(QueryUserDto, query, {
      excludeExtraneousValues: true,
    });

    const {
      page = 1,
      limit = 10,
      order = EOrder.DESC,
      orderBy = EOrderBy.CREATED_DATE,
      s,
      isActive,
    } = query;

    const notInIds = query?.['notInIds[]'] || [];
    const inIds = query?.['inIds[]'] || [];

    const skip = (+page - 1) * +limit;
    const condition = [];
    const textS = s?.trim();

    if (textS) {
      condition.push({
        $or: [
          { username: { $regex: String(textS), $options: 'i' } },
          { firstName: { $regex: String(textS), $options: 'i' } },
          { lastName: { $regex: String(textS), $options: 'i' } },
          { email: { $regex: String(textS), $options: 'i' } },
          { phone: { $regex: String(textS), $options: 'i' } },
        ],
      });
    }

    if (isActive === 0 || isActive === 1) {
      condition.push({
        isActive: !!isActive,
      });
    }

    const roles = query?.['roles[]'];
    if (roles && roles?.length > 0) {
      let rs: string[] = Array.isArray(roles) ? roles : [roles];
      rs = rs.filter((r: string) => Types.ObjectId.isValid(r));
      if (rs?.length > 0) {
        condition.push({
          roles: { $in: rs },
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

    const data = await this.userModel
      .find(condition?.length > 0 ? { $and: [...condition] } : {})
      .populate('roles', '_id, code')
      .populate('avatar', FieldFilePopulate)
      .select('-password')
      .limit(+limit)
      .skip(skip)
      .sort({ [orderBy]: order === EOrder.DESC ? -1 : 1 })
      .exec();
    const total = await this.userModel.countDocuments(
      condition?.length > 0 ? { $and: [...condition] } : {},
    );

    return { data, total };
  }

  /**
   *
   * @param {string[]}ids
   * @returns {Promise<TUserDocument[]>}
   */
  async findAllByIds(ids: string[]): Promise<TUserDocument[]> {
    if (ids?.length <= 0) return [];
    const data = await this.userModel
      .find()
      .where({ _id: { $in: ids }, left: { $ne: 0 } })
      .populate('roles', '_id, code')
      .populate('avatar', FieldFilePopulate)
      .select('-password')
      .exec();
    return data;
  }

  /**
   *
   * @param {string}id
   * @returns {Promise<TUserDocument>}
   */
  async findOne(id: string): Promise<TUserDocument> {
    const user = await this.userModel
      .findById(id)
      .populate({
        path: 'roles',
        select: '_id code',
      })
      .populate('avatar', FieldFilePopulate)
      .exec();
    if (!user?._id)
      throw new NotFoundException({ message: 'User is not exists!' });

    return user;
  }

  /**
   *
   * @param {string}username
   * @returns {Promise<TUserDocument>}
   */
  async findOneByUsername(username: string): Promise<TUserDocument> {
    return await this.userModel
      .findOne({ username })
      .populate({
        path: 'roles',
        select: '_id code',
      })
      .populate('avatar', FieldFilePopulate)
      .select('+password');
  }

  /**
   *
   * @param {string}email
   * @returns {Promise<TUserDocument>}
   */
  async findOneByEmail(email: string): Promise<TUserDocument> {
    return await this.userModel
      .findOne({ email })
      .populate({
        path: 'roles',
        select: '_id code',
      })
      .populate('avatar', FieldFilePopulate)
      .select('+password');
  }

  /**
   *
   * @param {string}id
   * @param {UpdateUserDto}body
   * @returns {Promise<boolean>}
   */
  async update(id: string, body: UpdateUserDto): Promise<boolean> {
    body = plainToInstance(UpdateUserDto, body, {
      excludeExtraneousValues: true,
    });
    const { username, roles, avatar } = body;
    const user = await this.userModel.findById(id);
    // #1: check user exists
    if (!user) throw new NotFoundException({ message: 'User Not Found!' });

    // #2: Check username unique
    if (username && username !== user.username) {
      const userByUsername = await this.userModel
        .findOne({ username })
        .where({ _id: { $ne: user._id } });
      if (userByUsername?._id)
        throw new BadRequestException({ message: 'Username already exists!' });
    }

    // #3: Valid role
    if (
      roles &&
      Array.isArray(roles) &&
      roles?.length > 0 &&
      !mongoObjectIds(roles)
    )
      throw new BadRequestException({ message: 'Roles must be [MongoId]!' });

    // #4: Valid avatar
    if (avatar && !isMongoId(avatar))
      throw new BadRequestException({ message: 'Avatar must be MongoId!' });

    // #4: Update user
    const update = await this.userModel.updateOne({ _id: id }, { ...body });
    return !!update.modifiedCount;
  }

  /**
   *
   * @param {string}id
   * @param {string}newPassword
   * @param {string}confirmPassword
   * @returns
   */
  async adminSetPassword(
    id: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<boolean> {
    // #1: Check user exist
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException({ message: 'User is not exists!' });

    // #2: Check confirmPassword match newPassword
    if (newPassword !== confirmPassword)
      throw new BadRequestException({
        message: 'confirmPassword must match newPassword exactly!',
      });

    // #3: Verify newPassword
    if (!isPwdStrong(newPassword))
      throw new BadRequestException({
        message:
          'Password must be between 6 and 15 characters, in which there must be at least 1 special character, 1 number and 1 uppercase letter!',
      });

    return await this.setPassword(id, newPassword);
  }

  /**
   *
   * @param {string}id
   * @param {string}password
   * @returns {Promise<boolean>}
   */
  async setPassword(id: string, password: string): Promise<boolean> {
    const isPass = isPwdStrong(password);
    if (!isPass) return false;
    const hashingPassword = this.passwordService.hashingPassword(password);
    const result = await this.userModel.updateOne(
      { _id: id },
      { $set: { password: hashingPassword } },
    );
    return !!result.modifiedCount;
  }

  /**
   *
   * @param {ERole}roleCode
   * @param {T}body
   * @returns {Promise< T & { roles: TRoleDocument[] } > }
   */
  async setRolePreInsert<T>(
    roleCode: ERole,
    body: T,
  ): Promise<
    T & {
      roles: TRoleDocument[];
    }
  > {
    const role = await this.roleService.findOneByCode(roleCode);
    if (!role)
      throw new BadRequestException({ message: 'Role is not exists!' });
    return {
      ...body,
      roles: [role],
    };
  }

  /**
   *
   * @param {RegisterDto}body
   * @returns
   */
  async registerUser(body: RegisterDto): Promise<TUserDocument> {
    body = plainToInstance(RegisterDto, body, {
      excludeExtraneousValues: true,
    });
    const username = body.username.trim();
    if (!isUsername(username))
      throw new BadRequestException({
        message:
          'Usernames can only use letters, numbers, underscores, and periods!',
      });

    // #2: check user exist
    const user = await this.findOneByUsername(username);
    if (user)
      throw new ConflictException({ message: 'Username already exists!' });

    // #3: Check confirmPassword match newPassword
    if (body.confirmPassword !== body.password)
      throw new BadRequestException({
        message: 'confirmPassword must match newPassword exactly!',
      });

    // #4: If you have to verify your email
    // [TODO] ...New successful mailing for saving information

    // #5: Save, default role "GUEST"
    const data = await this.setRolePreInsert<RegisterDto>(ERole.GUEST, body);
    const create = new this.userModel(data);
    const newUser = await create.save();
    if (!newUser?._id)
      throw new BadRequestException({ message: 'Register User Failed!' });
    return newUser;
  }
}
