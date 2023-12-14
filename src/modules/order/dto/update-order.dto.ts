import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EStatusOrder } from '../order.interface';

export class ApproveOrderDto {
  @ApiProperty({ type: String, required: true, enum: EStatusOrder })
  @IsEnum(EStatusOrder)
  @IsNotEmpty()
  @Expose()
  status: EStatusOrder;
}
