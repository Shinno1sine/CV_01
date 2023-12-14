import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryHasAuthorDto } from '@src/base/dto/query.dto';
import { alphabetRegex } from '@src/utils/string.util';
import { Expose } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsUppercase,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export class QueryTaxonomyDto extends QueryHasAuthorDto {
  @ApiPropertyOptional({ name: 'parentId', type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  parentId: string;

  @ApiPropertyOptional({
    name: 'isGenealogy',
    type: Number,
    maximum: 1,
    minimum: 0,
    default: 0,
    description:
      'Query all genealogy of the above parent directory (ParentId) - value: 0 | 1',
  })
  @IsOptional()
  @IsNumber()
  @Max(1)
  @Min(0)
  @Expose()
  isGenealogy: number;

  @ApiPropertyOptional({
    name: 'postType',
    type: String,
    maxLength: 30,
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @IsUppercase()
  @Matches(alphabetRegex)
  @MaxLength(30)
  @MinLength(3)
  @Expose()
  postType: string;
}

export class QueryMakeTreeTaxDto {
  @ApiPropertyOptional({ name: 'taxonomyId', type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  taxonomyId: string;
}
