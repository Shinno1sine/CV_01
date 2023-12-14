import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class TokenDto {
  @ApiProperty({ name: 'token', type: String })
  @IsNotEmpty()
  @IsString()
  @Expose()
  token: string;
}

export class RefreshTokenDto {
  @ApiProperty({ name: 'refreshToken', type: String })
  @IsNotEmpty()
  @IsString()
  @Expose()
  refreshToken: string;
}
