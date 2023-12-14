import { EStatusDoc } from '@configs/interface.config';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateShowtimeDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsMongoId()
  @Expose()
  film: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsMongoId()
  @Expose()
  room: string;

  @ApiProperty({ type: Number, required: true })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Expose()
  price: number;

  @ApiProperty({ type: Date, required: true, example: new Date() })
  @IsNotEmpty()
  @IsDate()
  @Expose()
  day: Date;

  @ApiProperty({ type: Date, required: true })
  @IsNotEmpty()
  @IsDate()
  @Expose()
  startHour: Date;

  @ApiProperty({ type: Date, required: true })
  @IsNotEmpty()
  @IsDate()
  @Expose()
  endHour: Date;

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

export class BookingShowtimeDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsMongoId()
  @Expose()
  idShowtime: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsMongoId()
  @Expose()
  idSeat: string;
}
