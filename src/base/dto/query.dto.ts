import { EOrder, EOrderBy } from '@configs/interface.config';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class QuerySortDto {
  @ApiPropertyOptional({
    name: 'order',
    type: String,
    enum: EOrder,
    default: EOrder.DESC,
  })
  @IsOptional()
  @IsString()
  @IsEnum(EOrder)
  @Expose()
  order: EOrder;

  @ApiPropertyOptional({
    name: 'orderBy',
    type: String,
    enum: EOrderBy,
    default: EOrderBy.CREATED_DATE,
  })
  @IsOptional()
  @IsString()
  @IsEnum(EOrderBy)
  @Expose()
  orderBy: EOrderBy;
}

export class QueryPaginateDto {
  @ApiPropertyOptional({ name: 'page', type: Number, default: 1 })
  @IsOptional()
  @IsNumber()
  @Expose()
  page: number;

  @ApiPropertyOptional({ name: 'limit', type: Number, default: 10 })
  @IsOptional()
  @IsNumber()
  @Expose()
  limit: number;
}

export class QueryDto extends IntersectionType(QueryPaginateDto, QuerySortDto) {
  @ApiPropertyOptional({ name: 's', type: String })
  @IsOptional()
  @IsString()
  @Expose()
  s: string;

  @ApiPropertyOptional({ type: Array })
  @IsOptional()
  @IsMongoId({ each: true })
  @Expose()
  'inIds[]': string[];

  @ApiPropertyOptional({ type: Array })
  @IsOptional()
  @IsMongoId({ each: true })
  @Expose()
  'notInIds[]': string[];
}

export class QueryHasAuthorDto extends QueryDto {
  @ApiPropertyOptional({ name: 'authorId', type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  authorId: string;
}
