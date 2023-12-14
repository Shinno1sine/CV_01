import { EMediaSystem } from '@modules/media/media.interface';
import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { isEnum } from 'class-validator';

export class EnumSystemMediaPipe implements PipeTransform {
  async transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type === 'param') {
      if (!isEnum(value, EMediaSystem))
        throw new BadRequestException('System must by s3 | server');
      return value;
    }
  }
}
