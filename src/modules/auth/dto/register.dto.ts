import { ApiProperty } from '@nestjs/swagger';
import { pwdStrongRegex, usernameRegex } from '@utils/string.util';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsEqualTo } from 'src/validations/is-equal-to.validator';

export class RegisterDto {
  @ApiProperty({ type: String, required: true, example: 'vietnt' })
  @Matches(usernameRegex)
  @IsNotEmpty()
  @IsString()
  @Expose()
  username: string;

  @ApiProperty({ type: String, required: true, example: 'vietnt' })
  @IsNotEmpty()
  @IsString()
  @Expose()
  firstName: string;

  @ApiProperty({ type: String, required: true, example: 'vietnt' })
  @IsNotEmpty()
  @IsString()
  @Expose()
  lastName: string;

  @ApiProperty({ type: String, default: 'dad45Dew@mKdfR', required: true })
  @IsNotEmpty()
  @Matches(pwdStrongRegex)
  @Expose()
  password: string;

  @ApiProperty({ type: String, default: 'dad45Dew@mKdfR', required: true })
  @IsNotEmpty()
  @Matches(pwdStrongRegex)
  @IsEqualTo<RegisterDto>('password')
  @Expose()
  confirmPassword: string;
}
