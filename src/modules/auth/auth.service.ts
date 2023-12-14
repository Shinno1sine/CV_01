import { TUserDocument } from '@modules/user/entities/user.entity';
import { UserService } from '@modules/user/user.service';
import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PasswordService } from 'src/base/service/password.service';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { IResAuth, TPayloadJwt } from './auth.interface';
import { ERole } from '@configs/permission.config';
import { isPwdStrong } from '@utils/string.util';
import { ResetPasswordDto } from './dto/forgot-password.dot';
import { RefreshTokenDto } from 'src/base/dto/token.dto';
import { plainToInstance } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /**
   *
   * @param {string}username
   * @param {string}password
   * @returns {Promise<TUserDocument>}
   */
  async validUserBeforeLogin(
    username: string,
    password: string,
    isCms = false,
  ): Promise<TUserDocument> {
    const user = await this.userService.findOneByUsername(username);
    console.log(
      '🚀 ~ file: auth.service.ts ~ line 41 ~ AuthService ~ user',
      user,
    );

    // #1: Check user exists
    if (!user)
      throw new BadRequestException({ message: 'Username is not exists!' });

    // #2: Check status
    if (!user.isActive)
      throw new ForbiddenException({
        message: 'The account is temporarily locked!',
      });

    // #3: isCms
    if (isCms) {
      const rolesCode = user?.roles?.map((roleItem) => roleItem.code);
      if (
        !(
          rolesCode.includes(ERole.ADMINISTRATOR) ||
          rolesCode.includes(ERole.EDITOR)
        )
      )
        throw new ForbiddenException({
          message: 'Must be a project administrator!',
        });
    }

    // #3: Check pass
    const isCorrectPassword = await this.passwordService.comparePassword(
      password,
      user.password,
    );
    if (!isCorrectPassword)
      throw new ForbiddenException({ message: 'Password was wrong!' });

    return user;
  }

  /**
   *
   * @param {TUserDocument}user
   * @returns {IResAuth}
   */
  async createToken(user: TUserDocument): Promise<IResAuth> {
    const payload = {
      _id: user._id.toString(),
      email: user?.email,
      phone: user?.phone,
      lastName: user.lastName,
      firstName: user.firstName,
    };

    const refreshPayload = {
      ...payload,
      hash: crypto.createHash('md5').update(user?.password).digest('hex'),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiredAt: Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7,
      refreshToken: this.jwtService.sign(refreshPayload, {
        expiresIn: '365d',
        secret: 'secretKey',
      }),
      expiredAtRefreshToken:
        Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 365,
      email: user.email,
      phone: user.phone,
    };
  }

  /**
   *
   * @param {TUserDocument}user
   * @param {string}newPassword
   * @param {string}oldPassword
   * @param {string}confirmPassword
   * @returns {Promise<boolean>}
   */
  async changePassword(
    user: TUserDocument,
    newPassword: string,
    oldPassword: string,
    confirmPassword: string,
  ): Promise<boolean> {
    // #1: Check confirmPassword match newPassword
    if (newPassword !== confirmPassword)
      throw new BadRequestException({
        message: 'confirmPassword must match newPassword exactly!',
      });

    // #2: Verify newPassword
    if (!isPwdStrong(newPassword))
      throw new BadRequestException({
        message:
          'Password must be between 6 and 15 characters, in which there must be at least 1 special character, 1 number and 1 uppercase letter!',
      });

    // #3: Check Old and new passwords cannot be the same
    if (oldPassword === newPassword)
      throw new BadRequestException({
        message: 'Old password and new password are not the same!',
      });

    // #4: Check comparePassword
    const isCorrectPassword = await this.passwordService.comparePassword(
      oldPassword,
      user.password,
    );

    if (!isCorrectPassword)
      throw new ForbiddenException({
        message: 'The current password provided is incorrect!',
      });

    return await this.userService.setPassword(
      user._id.toHexString(),
      newPassword,
    );
  }

  async forgotPassword(email: string): Promise<boolean> {
    // #1: Validator email
    if (!IsEmail(email))
      throw new BadRequestException({
        message: 'The email address is not in the correct format!',
      });

    // #2: Query user by email
    const user = await this.userService.findOneByEmail(email);
    if (!user)
      throw new NotFoundException({
        message: 'Email is not exist!',
      });

    // #3: Create token rết password
    const payload: TPayloadJwt = {
      _id: user._id.toHexString(),
      email: user?.email,
      phone: user?.phone,
      lastName: user?.lastName,
      firstName: user?.firstName,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '2h',
      secret: 'secretKey',
    });

    // #4: Send link reset password via personal mailbox
    const url = `${process.env.FRONTEND_DOMAIN}reset-password/?token=${token}`;
    const sendMailer = await this.mailService.sendMailer(
      user.email,
      '',
      '../../mail/templates/forgot-password.hbs',
      {
        name: user.username || user?.email,
        url,
      },
    );

    return !!(sendMailer?.accepted?.length > 0);
  }

  /**
   *
   * @param {ResetPasswordDto}body
   * @returns {Promise<boolean>}
   */
  async resetPassword(body: ResetPasswordDto): Promise<boolean> {
    body = plainToInstance(ResetPasswordDto, body, {
      excludeExtraneousValues: true,
    });
    // #1: Check verify token
    const payloadJwt = await this.jwtService.verifyAsync<TPayloadJwt>(
      body.token,
    );
    if (!payloadJwt?._id) {
      throw new BadGatewayException({ message: 'Invalid token!' });
    }

    // #2: Check confirmPassword match newPassword
    if (body.newPassword !== body.confirmPassword)
      throw new BadRequestException({
        message: 'confirmPassword must match newPassword exactly!',
      });

    // #2: Verify newPassword
    if (!isPwdStrong(body.newPassword))
      throw new BadRequestException({
        message:
          'Password must be between 6 and 15 characters, in which there must be at least 1 special character, 1 number and 1 uppercase letter!',
      });

    return await this.userService.setPassword(payloadJwt._id, body.newPassword);
  }

  async refreshToken(
    body: RefreshTokenDto,
  ): Promise<{ accessToken: string; expiredAt: number }> {
    body = plainToInstance(RefreshTokenDto, body, {
      excludeExtraneousValues: true,
    });
    const { refreshToken } = body;
    const payload = await this.jwtService.verifyAsync<TPayloadJwt>(
      refreshToken,
    );

    // #1: Check verify token
    if (!payload?._id)
      throw new BadRequestException({ message: 'Token Is Invalid!' });

    const user = await this.userService.findOne(payload._id);
    // #2: Check User exists
    if (!user?._id)
      throw new NotFoundException({ message: 'User Is Not Exist!' });

    // #3: Check status user
    if (!user.isActive)
      throw new ForbiddenException({ message: 'User Is Temporarily Locked!' });

    // #4: General token
    const newPayload = {
      _id: user._id.toString(),
      email: user?.email,
      phone: user?.phone,
      lastName: user.lastName,
      firstName: user.firstName,
    };
    const accessToken = await this.jwtService.signAsync(newPayload);
    if (!accessToken)
      throw new HttpException(
        { message: 'General Token Failed!' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    return {
      accessToken,
      expiredAt: Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7,
    };
  }
}
