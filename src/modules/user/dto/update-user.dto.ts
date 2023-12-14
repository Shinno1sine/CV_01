import { ApiPropertyOptional } from '@nestjs/swagger';
import { usernameRegex } from '@utils/string.util';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @Matches(usernameRegex)
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, example: 'Twinger1' })
  @Expose()
  username: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, example: 'Twinger' })
  @Expose()
  firstName: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, example: 'Company' })
  @Expose()
  lastName: string;

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
  roles: string[];
}
