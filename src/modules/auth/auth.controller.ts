import { IRes } from '@configs/interface.config';
import { TUserDocument } from '@modules/user/entities/user.entity';
import { UserService } from '@modules/user/user.service';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RefreshTokenDto } from 'src/base/dto/token.dto';
import { Auth, AuthUser } from './auth.decorator';
import { IResAuth } from './auth.interface';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dot';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Login to the system' })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<IRes<{ user: TUserDocument; auth: IResAuth }>> {
    try {
      const user = await this.authService.validUserBeforeLogin(
        loginDto.username,
        loginDto.password,
      );

      const auth = await this.authService.createToken(user);
      Logger.debug('🚀 ~ Auth ~ login:', auth);

      user.password = undefined;

      return { message: 'Login Success!', data: { auth, user } };
    } catch (error) {
      Logger.error('🚀 ~ error ~ login:', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('login/cms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[ADMIN] Login to the system, only available for admin users',
  })
  async loginCms(
    @Body() loginDto: LoginDto,
  ): Promise<IRes<{ user: TUserDocument; auth: IResAuth }>> {
    try {
      const user = await this.authService.validUserBeforeLogin(
        loginDto.username,
        loginDto.password,
        true,
      );

      const auth = await this.authService.createToken(user);
      Logger.debug('🚀 ~ Auth ~ login:', auth);

      user.password = undefined;

      return { message: 'Login Success!', data: { auth, user } };
    } catch (error) {
      Logger.error('🚀 ~ error ~ loginCms:', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('logout')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[USER - ADMIN] Logout to the system',
  })
  async logout(@AuthUser() user: TUserDocument): Promise<IRes> {
    try {
      // [TODO] ...
      Logger.debug('🚀 ~ Success ~ logout:', user);
      return { message: 'Logout Success!' };
    } catch (error) {
      Logger.error('🚀 ~ error ~ logout:', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('change-password')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[USER] Change your password',
  })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes> {
    try {
      const result = await this.authService.changePassword(
        user,
        body.newPassword,
        body.oldPassword,
        body.confirmPassword,
      );
      if (!result)
        throw new BadRequestException({
          message: 'Change Password Failed!',
        });
      return { message: 'Change Password Success!' };
    } catch (error) {
      Logger.error('🚀 ~ error ~ changePassword:', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[USER] Register as a system user',
  })
  async register(@Body() body: RegisterDto): Promise<IRes> {
    try {
      await this.userService.registerUser(body);

      return { message: 'Register Success!' };
    } catch (error) {
      Logger.error('🚀 ~ error ~ register:', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[USER] Forgot Password',
  })
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<IRes> {
    Logger.debug('🚀 ~ AuthController ~ forgotPassword ~ body', body);
    try {
      const result = await this.authService.forgotPassword(body.email);
      if (!result) return { message: 'Forgot Password Failed!' };
      return { message: 'Forgot Password Success!' };
    } catch (error) {
      Logger.error('🚀 ~ error ~ Forgot Password:', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[USER] Reset Password (URL -> forgot-password)',
  })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<IRes> {
    try {
      const result = await this.authService.resetPassword(body);
      if (!result)
        throw new BadRequestException({
          message: 'Reset Password Failed!',
        });
      return { message: 'Reset Password Success!' };
    } catch (error) {
      Logger.error('🚀 ~ error ~ Reset Password:', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Refresh Token' })
  @Auth()
  async refreshToken(
    @Body() body: RefreshTokenDto,
  ): Promise<IRes<{ accessToken: string; expiredAt: number }>> {
    try {
      const data = await this.authService.refreshToken(body);
      return { message: 'Refresh Token Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ error ~ Refresh Token:', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
