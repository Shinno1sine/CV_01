import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { QueryHasAuthorDto } from '@src/base/dto/query.dto';
import { EStatusDoc } from '@src/configs/interface.config';
import { Expose } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class QueryFilmDto extends QueryHasAuthorDto {
  @ApiPropertyOptional({ enum: EStatusDoc, type: String })
  @IsOptional()
  @IsEnum(EStatusDoc)
  @IsString()
  @Expose()
  status: EStatusDoc;

  @ApiPropertyOptional({ type: Array })
  @IsOptional()
  @IsMongoId({ each: true })
  @Expose()
  'taxonomyIds[]': string[];
}

export class QueryClientFilmDto extends OmitType(QueryFilmDto, [
  'status',
] as const) {}
