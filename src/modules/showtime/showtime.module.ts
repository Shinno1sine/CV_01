import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShowtimeSchema } from './entities/showtime.entity';
import { ShowtimeController } from './showtime.controller';
import { ShowtimeService } from './showtime.service';
import { RoomModule } from '../room/room.module';
import { FilmModule } from '../film/film.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'showtime', schema: ShowtimeSchema }]),
    FilmModule,
    RoomModule,
  ],
  controllers: [ShowtimeController],
  providers: [ShowtimeService],
  exports: [ShowtimeService],
})
export class ShowtimeModule {}
