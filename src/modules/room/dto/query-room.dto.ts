import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryDto, QueryHasAuthorDto } from '@src/base/dto/query.dto';
import { EStatusDoc } from '@src/configs/interface.config';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryRoomDto extends QueryHasAuthorDto {
  @ApiPropertyOptional({ enum: EStatusDoc, type: String })
  @IsOptional()
  @IsEnum(EStatusDoc)
  @IsString()
  @Expose()
  status: EStatusDoc;
}

export class QueryLayoutDto extends QueryDto {
  @ApiPropertyOptional({ enum: EStatusDoc, type: String })
  @IsOptional()
  @IsEnum(EStatusDoc)
  @IsString()
  @Expose()
  status: EStatusDoc;
}
