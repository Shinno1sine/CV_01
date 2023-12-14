import { Module } from '@nestjs/common';
import { OptionService } from './option.service';
import { OptionController } from './option.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OptionSchema } from './entities/option.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'option', schema: OptionSchema }]),
  ],
  controllers: [OptionController],
  providers: [OptionService],
})
export class OptionModule {}
