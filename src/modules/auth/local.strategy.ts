import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TUserDocument } from '@modules/user/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<TUserDocument> {
    const user = await this.authService.validUserBeforeLogin(
      username,
      password,
    );
    if (!user) {
      throw new HttpException(
        { message: 'User does not logged in!' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
}
