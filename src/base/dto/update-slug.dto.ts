import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsSlug } from 'src/validations/is-slug.validator';

export class UpdateSlugDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @IsSlug()
  @Expose()
  slug: string;
}
