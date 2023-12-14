import {
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send-mail-mailer')
  @ApiOperation({ summary: '[SYSTEM] Test send mail @nestjs-modules/mailer' })
  @HttpCode(HttpStatus.OK)
  async sendMailer() {
    try {
      await this.mailService.sendMailer(
        'banv@twinger.vn',
        'Verify your email for Twinger Core',
        `../../mail/templates/email-verify`,
        {
          name: 'Twinger member',
          url: 'https:/twinger.vn/',
        },
      );
      return { message: 'Send Mail Success!' };
    } catch (error) {
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
