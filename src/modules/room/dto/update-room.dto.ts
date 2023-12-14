import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateLayoutDto, CreateRoomDto } from './create-room.dto';
import { EStatusSeat, ETypeSeat } from '../room.interface';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
export class UpdateLayoutDto extends PartialType(CreateLayoutDto) {}
export class UpdateSeatDto {
  @ApiPropertyOptional({
    type: String,
    enum: EStatusSeat,
  })
  @IsOptional()
  @IsString()
  @IsEnum(EStatusSeat)
  @Expose()
  status: EStatusSeat;

  @ApiPropertyOptional({
    type: String,
    enum: ETypeSeat,
  })
  @IsOptional()
  @IsString()
  @IsEnum(ETypeSeat)
  @Expose()
  type: ETypeSeat;
}
