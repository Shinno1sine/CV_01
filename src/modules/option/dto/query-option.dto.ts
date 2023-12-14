import { ApiProperty } from '@nestjs/swagger';
import { QueryHasAuthorDto } from '@src/base/dto/query.dto';
import { azUppercaseRegex } from '@src/utils/string.util';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class QueryOptionDto extends QueryHasAuthorDto {}

export class ActionOptionByKeysDto {
  @ApiProperty({
    required: true,
    description: 'Key of option',
    example: ['KEY1', 'KEY2'],
    type: [String],
  })
  @IsNotEmpty()
  @IsString({ each: true })
  @Matches(azUppercaseRegex, {
    message: 'Key must be uppercase letters [A-Z]',
    each: true,
  })
  @Expose()
  'key[]': string[];
}
