import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FolderSchema } from './entities/folder.entity';
import { FileSchema } from './entities/file.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'folder', schema: FolderSchema },
      { name: 'file', schema: FileSchema },
    ]),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
