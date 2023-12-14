import { EStatusDoc } from '@configs/interface.config';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFilmDto {
  @ApiProperty({ type: String, maxLength: 255, minLength: 3 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(3)
  @Expose()
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  @Expose()
  director: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  actor: string;

  @ApiPropertyOptional({ type: String, default: null })
  @IsOptional()
  @IsString()
  @Expose()
  content: string;

  @ApiPropertyOptional({ type: String, default: null, maxLength: 400 })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  @Expose()
  excerpt: string;

  @ApiPropertyOptional({ type: String, default: null })
  @IsOptional()
  @IsMongoId()
  @Expose()
  thumbnail: string;

  @ApiPropertyOptional({ type: String, default: null })
  @IsOptional()
  @IsMongoId()
  @Expose()
  trailer: string;

  @ApiPropertyOptional({ type: String, default: null })
  @IsOptional()
  @IsString()
  @Expose()
  trailerUrl: string;

  @ApiPropertyOptional({ type: String, default: [] })
  @IsOptional()
  @IsMongoId({ each: true })
  @Expose()
  taxonomies: string[];

  @ApiPropertyOptional({ type: Date, default: new Date() })
  @IsOptional()
  @IsDate()
  @Expose()
  scheduleAt: Date;

  @ApiPropertyOptional({
    type: String,
    default: EStatusDoc.INACTIVE,
    enum: EStatusDoc,
  })
  @IsOptional()
  @IsString()
  @IsEnum(EStatusDoc)
  @Expose()
  status: EStatusDoc;
}
