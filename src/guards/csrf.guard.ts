import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { HmacSHA256, enc } from 'crypto-js';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly secretKey: string;
  constructor() {
    this.secretKey = process.env.SECRET_KEY;
  }
  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV === 'production') {
      const request = context.switchToHttp().getRequest();
      const csrfToken = request.headers['x-csrf-token'];

      const url = request.url.split('?')[0];
      const method = request.method;

      if (!csrfToken)
        throw new ForbiddenException({
          message: 'Invalid API Key.',
        });

      const data = `${method}:${url}`;
      const expectedApiKey = this.createSignature(data);
      if (csrfToken !== expectedApiKey)
        throw new ForbiddenException({
          message: 'Invalid API Key.',
        });

      return true;
    } else {
      return true;
    }
  }

  private createSignature(data: string): string {
    const hmac = HmacSHA256(data, this.secretKey);
    return hmac.toString(enc.Hex);
  }
}
