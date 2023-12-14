import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({
    name: 'name',
    type: String,
    required: true,
    maxLength: 30,
    minLength: 3,
    example: 'Folder',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @MinLength(3)
  @Expose()
  name: string;

  @ApiPropertyOptional({
    name: 'parentId',
    type: String,
    example: '637538b18bb90293ce4a39dx',
  })
  @IsOptional()
  @IsMongoId()
  @Expose()
  parentId: string;
}
