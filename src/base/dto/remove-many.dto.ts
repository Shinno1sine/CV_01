import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class RemoveManyDto {
  @ApiProperty({ required: true, name: 'ids', type: [String] })
  @IsNotEmpty()
  @IsMongoId({ each: true })
  @Expose()
  ids: string[];
}
