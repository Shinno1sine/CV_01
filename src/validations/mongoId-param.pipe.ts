import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { isMongoId } from 'class-validator';

export class MongoIdParam implements PipeTransform {
  notInIds: string[] = [];
  constructor(a?: string[]) {
    this.notInIds = a || [];
  }
  async transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type === 'param') {
      if (!isMongoId(value))
        throw new BadRequestException({ message: 'ID must be MongoId!' });
      if (this.notInIds.length > 0 && this.notInIds.includes(value))
        throw new BadRequestException({ message: 'ID invalid!' });
      return value;
    }
    return value;
  }
}
