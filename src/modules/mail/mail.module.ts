import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MAILER_CONFIG } from '@configs/mail.config';

@Module({
  imports: [
    MailerModule.forRoot({
      defaults: {
        from: `"${MAILER_CONFIG.MAIL_USER}" <${MAILER_CONFIG.MAIL_USER}>`,
      },
      transport: {
        host: MAILER_CONFIG.MAIL_HOST,
        port: MAILER_CONFIG.MAIL_PORT,
        secure: false,
        auth: {
          user: MAILER_CONFIG.MAIL_USER,
          pass: MAILER_CONFIG.MAIL_PASSWORD,
        },
      },
      template: {
        dir: join(__dirname, '..', '..', '/mail/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
