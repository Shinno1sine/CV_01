import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { azUppercaseRegex } from '@utils/string.util';
import { Expose } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUppercase,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTaxonomyDto {
  @ApiProperty({
    type: String,
    required: true,
    maxLength: 191,
    minLength: 3,
    example: 'Taxonomy post',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(151)
  @MinLength(3)
  @Expose()
  name: string;

  @ApiPropertyOptional({
    type: String,
    default: null,
  })
  @IsOptional()
  @IsString()
  @Expose()
  description: string;

  @ApiPropertyOptional({
    type: String,
    example: '637538b18bb90293ce4a39dx',
    default: null,
  })
  @IsOptional()
  @IsMongoId()
  @Expose()
  parentId: string;

  @ApiProperty({ type: String, maximum: 30, minimum: 3 })
  @IsNotEmpty()
  @IsString()
  @IsUppercase()
  @Matches(azUppercaseRegex)
  @Expose()
  postType: string;
}
