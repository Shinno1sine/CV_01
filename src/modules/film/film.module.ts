import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaModule } from '../media/media.module';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';
import { FilmSchema } from './entities/film.entity';
import { FilmService } from './film.service';
import { FilmController } from './film.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'film', schema: FilmSchema }]),
    TaxonomyModule,
    MediaModule,
  ],
  controllers: [FilmController],
  providers: [FilmService],
  exports: [FilmService],
})
export class FilmModule {}
