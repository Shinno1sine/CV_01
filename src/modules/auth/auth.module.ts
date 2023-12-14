import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@modules/user/user.module';
import { PasswordService } from 'src/base/service/password.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@configs/auth.config';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiredTime },
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    LocalStrategy,
    JwtStrategy,
    MailService,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
