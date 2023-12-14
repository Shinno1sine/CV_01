import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsMongoId, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class FileUploadDto {
  @ApiProperty({ type: String, format: 'binary' })
  @Expose()
  file: string;

  @ApiProperty({
    type: Number,
    maximum: 1,
    minimum: 0,
    description: 'isWebp must be 0 | 1',
    default: 1,
  })
  @IsNumber()
  @Max(1)
  @Min(0)
  @Expose()
  isWebp: number;

  @ApiPropertyOptional({ type: String, example: '637538b18bb90293ce4a39dx' })
  @IsOptional()
  @IsMongoId()
  @Expose()
  folderId: string;
}

export class FileUploadMultiDto {
  @ApiProperty({ type: [String], format: 'binary' })
  file: string[];

  @ApiPropertyOptional({
    type: Number,
    maximum: 1,
    minimum: 0,
    description: 'isWebp must be 0 | 1',
    default: 1,
  })
  @IsNumber()
  @Max(1)
  @Min(0)
  @Expose()
  isWebp: number;
}

export class FileUploadMultiInsertDbDto extends FileUploadMultiDto {
  @ApiPropertyOptional({ type: String, example: '637538b18bb90293ce4a39dx' })
  @IsOptional()
  @IsMongoId()
  @Expose()
  folderId: string;
}
