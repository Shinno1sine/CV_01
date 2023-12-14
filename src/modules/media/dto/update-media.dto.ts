import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateFolderDto {
  @ApiPropertyOptional({
    name: 'name',
    type: String,
    required: true,
    maxLength: 30,
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @MinLength(3)
  @Expose()
  name: string;
}

export class MoveFolderDto {
  @ApiPropertyOptional({ name: 'newParentId', type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  newParentId: string;
}

export class UpdateFileDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  alt: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  caption: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  description: string;
}

export class ResizeImageDto {
  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Expose()
  width: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Expose()
  height: number;
}

export class MoveFileDto {
  @ApiPropertyOptional({
    type: String,
    example: '637538b18bb90293ce4a39dx',
  })
  @IsOptional()
  @IsMongoId()
  @Expose()
  folderId: string;
}
