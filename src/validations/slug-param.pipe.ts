import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { isSlug } from '@utils/string.util';

export class SlugParamPipe implements PipeTransform {
  async transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type === 'param') {
      if (!isSlug(value))
        throw new BadRequestException({ message: 'Slug invalid!' });
      return value;
    }
    return value;
  }
}
