import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ type: String, required: true, default: null })
  @IsMongoId()
  @IsNotEmpty()
  @Expose()
  showtime: string;

  @ApiProperty({ type: [String], required: true, default: [] })
  @IsMongoId({ each: true })
  @IsNotEmpty()
  @Expose()
  seats: string[];
}
