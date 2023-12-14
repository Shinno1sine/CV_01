import { ApiProperty } from '@nestjs/swagger';
import { pwdStrongRegex } from '@utils/string.util';
import { Expose } from 'class-transformer';
import { IsNotEmpty, Matches } from 'class-validator';
import { IsEqualTo } from 'src/validations/is-equal-to.validator';
import { IsNotEqualTo } from 'src/validations/is-not-equal-to.validator';

export class PasswordDto {
  @IsNotEmpty()
  @Matches(pwdStrongRegex)
  @ApiProperty({ type: String, default: 'dad45Dew@mKdfR', required: true })
  @IsNotEqualTo<ChangePasswordDto>('oldPassword')
  @Expose()
  newPassword: string;

  @IsNotEmpty()
  @Matches(pwdStrongRegex)
  @ApiProperty({ type: String, default: 'dad45Dew@mKdfR', required: true })
  @IsEqualTo<ChangePasswordDto>('newPassword')
  @Expose()
  confirmPassword: string;
}

export class ChangePasswordDto extends PasswordDto {
  @IsNotEmpty()
  @Matches(pwdStrongRegex)
  @ApiProperty({ type: String, default: 'dad45Dew@vfsDf', required: true })
  @Expose()
  oldPassword: string;
}
