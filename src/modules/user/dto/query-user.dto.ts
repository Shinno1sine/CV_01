import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsMongoId, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { QueryDto } from 'src/base/dto/query.dto';

export class QueryUserDto extends PartialType(QueryDto) {
  @ApiPropertyOptional({
    name: 'isActive',
    type: Number,
    maximum: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Max(1)
  @Min(0)
  @Expose()
  isActive?: number;

  @ApiPropertyOptional({ name: 'roles[]', type: [String] })
  @IsOptional()
  @IsMongoId({ each: true })
  @Expose()
  'roles[]'?: string[];
}
