import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserDto extends PartialType(RegisterDto) {
  @ApiPropertyOptional({
    type: String,
    example: '637dfc8f5f1fde60c5ea050a',
  })
  @IsOptional()
  @IsString()
  @IsMongoId()
  @Expose()
  avatar: string;

  @ApiPropertyOptional({ type: String, example: 'developer.twinger@gmail.com' })
  @IsOptional()
  @IsEmail()
  @Expose()
  email: string;

  @ApiPropertyOptional({ type: String, maxLength: 20, example: '+84965420174' })
  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(20)
  @Expose()
  phone: string;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @Expose()
  @IsMongoId({ each: true })
  @Expose()
  roles: string[];
}
