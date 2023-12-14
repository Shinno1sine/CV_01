import { ApiProperty } from '@nestjs/swagger';
import { azUppercaseRegex } from '@src/utils/string.util';
import { Expose, Type } from 'class-transformer';
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsNotEmpty,
  ValidateNested,
  IsArray,
} from 'class-validator';

export class CreateUpdateOptionDto {
  @ApiProperty({
    required: true,
    description: 'Key of option',
    example: 'KEY',
    minLength: 3,
    maxLength: 50,
    type: String,
  })
  @Matches(azUppercaseRegex, { message: 'Key must be uppercase letters [A-Z]' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @IsNotEmpty()
  @Expose()
  key: string;

  @ApiProperty({
    required: true,
    example: ['any', 'string', 'number'],
    description:
      'Value of option. Can be of any type including string, number, etc.',
  })
  @IsNotEmpty()
  @Expose()
  value: any;
}

export class CreateUpdateManyOptionDto {
  @ApiProperty({
    name: 'options',
    type: Array,
    required: true,
    example: [
      {
        key: 'KEYA',
        value: 'anything',
      },
      {
        key: 'KEYB',
        value: ['any', 'string', 'number'],
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUpdateOptionDto)
  @Expose()
  options: Array<CreateUpdateOptionDto>;
}
