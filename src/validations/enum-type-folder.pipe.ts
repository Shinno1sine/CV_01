import { EMediaFile } from '@modules/media/media.interface';
import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { isEnum } from 'class-validator';

export class EnumTypeFolderPipe implements PipeTransform {
  async transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type === 'param') {
      if (!isEnum(value, EMediaFile))
        throw new BadRequestException(
          'Type must by image | document | video | audio',
        );
      return value;
    }
  }
}
