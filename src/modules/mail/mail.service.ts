import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   *
   * @param {string}to
   * @param {string}subject
   * @param {string}template
   * @param {Record<string, any>}context
   * @returns {Promise<SentMessageInfo>}
   */
  async sendMailer(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<SentMessageInfo> {
    const res = await this.mailerService.sendMail({
      to,
      subject,
      template,
      context: { ...context },
    });
    Logger.debug('🚀 ~ MailService ~ res', res);
    return res;
  }
}
