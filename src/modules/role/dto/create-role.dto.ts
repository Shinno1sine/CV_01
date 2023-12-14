import { ACCESS } from '@configs/permission.config';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { azUppercaseRegex } from '@utils/string.util';
import { Expose } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    required: true,
    name: 'code',
    type: String,
    example: 'CODE',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(azUppercaseRegex)
  code: string;

  @ApiPropertyOptional({ name: 'description', type: String })
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    name: 'permissions',
    type: Array,
    enum: ACCESS,
    default: [],
  })
  @Expose()
  @IsOptional()
  @IsArray()
  @IsEnum(ACCESS, { each: true })
  permissions?: [ACCESS];
}
