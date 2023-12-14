import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsMongoId, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { QueryDto } from 'src/base/dto/query.dto';

export class QueryFolderDto extends QueryDto {
  @ApiPropertyOptional({ name: 'parentId', type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  parentId: string;

  @ApiPropertyOptional({
    name: 'isGenealogy',
    type: Number,
    maximum: 1,
    minimum: 0,
    default: 0,
    description:
      'Query all genealogy of the above parent directory (ParentId) - value: 0 | 1',
  })
  @IsOptional()
  @IsNumber()
  @Max(1)
  @Min(0)
  @Expose()
  isGenealogy: number;
}

export class QueryFileDto extends QueryDto {
  @ApiPropertyOptional({ name: 'folderId', type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  folderId: string;
}

export class QueryMakeTreeFolderDto {
  @ApiPropertyOptional({ name: 'folderId', type: String })
  @IsOptional()
  @IsMongoId()
  @Expose()
  folderId: string;
}
