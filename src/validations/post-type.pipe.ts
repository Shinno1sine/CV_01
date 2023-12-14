import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { isAzUppercaseRegex } from '@src/utils/string.util';
import { isUppercase } from 'class-validator';

export class PostTypePipe implements PipeTransform {
  async transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type === 'param') {
      if (!isAzUppercaseRegex(value) && !isUppercase(value)) {
        throw new BadRequestException({
          message:
            'PostType Must be contiguous characters without accents, uppercase and no special characters!',
        });
      }
      return value;
    }
    return value;
  }
}
