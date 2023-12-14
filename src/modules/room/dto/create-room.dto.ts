import { EStatusDoc } from '@configs/interface.config';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ type: String, maxLength: 255, minLength: 3 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(3)
  @Expose()
  name: string;

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

  @ApiPropertyOptional({ type: String, required: true })
  @IsOptional()
  @IsMongoId()
  @Expose()
  layout: string;

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

export class CreateLayoutDto {
  @ApiProperty({ type: String, maxLength: 255, minLength: 3 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(3)
  @Expose()
  name: string;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsNotEmpty()
  @Expose()
  row: number;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsNotEmpty()
  @Expose()
  column: number;

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
