import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';

@Catch(HttpException)
export class HttpExceptionI18nFilter implements ExceptionFilter {
  private i18nD: I18nService;
  constructor(protected i18n?: I18nService) {
    this.i18n = this.i18nD;
  }
  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;
    const lang = ctx.getRequest().headers.lang;
    const error: any = exception.getResponse();

    let message: any;
    try {
      if (Array.isArray(error.message)) {
        message = [];
        await Promise.all(
          error.message.map(async (m: string) => {
            message.push(await this.i18n.translate(m, { lang }));
          }),
        );
      } else {
        message = await await this.i18n.translate(message, { lang });
      }
    } catch (e) {
      message = error.message;
    }

    response.status(status).send({
      statusCode: status,
      message: error?.message || 'Request Failed!',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
