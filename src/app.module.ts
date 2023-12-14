import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from '@configs/configuration.config';
import { ResponseInterceptor } from '@interceptors/response/response.interceptor';
import { HttpExceptionFilter } from '@filters/http-exception/http-exception.filter';
// import { I18nModuleConfig } from '@languages/i18n.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleModule } from './modules/role/role.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PermissionGuard } from '@modules/auth/permission.guard';
import { MailModule } from './modules/mail/mail.module';
import { MediaModule } from './modules/media/media.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { ConsoleModule } from 'nestjs-console';
import { HelloCommand } from './command/hello.command';
import { CsrfGuard } from './guards/csrf.guard';
import { OptionModule } from './modules/option/option.module';
import { FilmModule } from './modules/film/film.module';
import { RoomModule } from './modules/room/room.module';
import { ShowtimeModule } from './modules/showtime/showtime.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: `mongodb+srv://vietnt:EYPwyZH52acRscRL@datn.jgfiytq.mongodb.net/datn-backend`,
        retryAttempts: 3,
      }),
    }),
    TerminusModule,
    HttpModule,
    ConsoleModule,
    RoleModule,
    AuthModule,
    UserModule,
    MailModule,
    MediaModule,
    TaxonomyModule,
    OptionModule,
    FilmModule,
    RoomModule,
    ShowtimeModule,
    OrderModule,
    // I18nModuleConfig,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    HelloCommand,
  ],
})
export class AppModule {}
