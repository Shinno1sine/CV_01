import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { jwtConstants } from '@configs/auth.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.userService.findOne(payload?._id?.toString());
      console.log(
        '🚀 ~ file: jwt.strategy.ts:20 ~ JwtStrategy ~ validate ~ user:',
        user,
      );
      return user;
    } catch (error) {
      if (error) return 'Unauthorized';
    }
  }
}
