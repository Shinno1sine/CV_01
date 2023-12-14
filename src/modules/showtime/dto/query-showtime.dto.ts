import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { QueryHasAuthorDto } from '@src/base/dto/query.dto';
import { EStatusDoc } from '@src/configs/interface.config';
import { Expose } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

export class QueryShowtimeDto extends QueryHasAuthorDto {
  @ApiPropertyOptional({ enum: EStatusDoc, type: String })
  @IsOptional()
  @IsEnum(EStatusDoc)
  @IsString()
  @Expose()
  status: EStatusDoc;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  film: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  room: string;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDate()
  @Expose()
  day: Date;
}

export class QueryClientShowtimeDto extends OmitType(QueryShowtimeDto, [
  'status',
] as const) {}
