import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTaxonomyDto {
  @ApiProperty({
    type: String,
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
}
export class MoveTaxonomyDto {
  @ApiPropertyOptional({ name: 'newParentId', type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  newParentId: string;
}
