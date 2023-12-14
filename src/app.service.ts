import { Injectable } from '@nestjs/common';
import { IRes } from './configs/interface.config';

@Injectable()
export class AppService {
  async getHello(): Promise<IRes<string>> {
    return { data: process.env.NODE_ENV, message: 'Success' };
  }
}
