import { ApiProperty } from '@nestjs/swagger';
import { pwdStrongRegex } from '@utils/string.util';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsEqualTo } from 'src/validations/is-equal-to.validator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @ApiProperty({ type: String, required: true })
  @Expose()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: String,
    required: true,
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzY4ZTBjNDc5MzdmYWZkY2ZlNGQ4MTMiLCJlbWFpbCI6ImRldmVsb3Blci50d2luZ2VyQGdtYWlsLmNvbSIsInBob25lIjoiKzg0OTMzODg2NTU2IiwibGFzdE5hbWUiOiIiLCJmaXJzdE5hbWUiOiIiLCJpYXQiOjE2Njc5ODU3ODksImV4cCI6MTY2ODU5MDU4OX0.iEXT0zHK2or_lmR3bFpRy71VcXFsim-IcjzWFaoAroc',
  })
  @Expose()
  token: string;

  @IsNotEmpty()
  @Matches(pwdStrongRegex)
  @ApiProperty({ type: String, default: 'dad45Dew@mKdfR', required: true })
  @Expose()
  newPassword: string;

  @IsNotEmpty()
  @Matches(pwdStrongRegex)
  @ApiProperty({ type: String, default: 'dad45Dew@mKdfR', required: true })
  @IsEqualTo<ResetPasswordDto>('newPassword')
  @Expose()
  confirmPassword: string;
}
