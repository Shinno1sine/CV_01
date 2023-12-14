import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryDto } from '@src/base/dto/query.dto';
import { EStatusDoc } from '@src/configs/interface.config';
import { Expose } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class QueryOrderDto extends QueryDto {
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
  userId: string;
}

export class QueryMyOrderDto extends QueryDto {
  @ApiPropertyOptional({ enum: EStatusDoc, type: String })
  @IsOptional()
  @IsEnum(EStatusDoc)
  @IsString()
  @Expose()
  status: EStatusDoc;
}
