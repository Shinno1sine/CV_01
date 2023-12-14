import { ApiProperty } from '@nestjs/swagger';
import { pwdStrongRegex } from '@utils/string.util';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'adminDatn', type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Expose()
  username: string;

  @ApiProperty({ example: 'dad45Dew@vfsdf', type: String, required: true })
  @IsNotEmpty()
  @Matches(pwdStrongRegex)
  @Expose()
  password: string;
}
