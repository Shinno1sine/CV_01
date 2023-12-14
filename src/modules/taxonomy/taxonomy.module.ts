import { Module } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';
import { TaxonomyController } from './taxonomy.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxonomySchema } from './entities/taxonomy.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'taxonomy', schema: TaxonomySchema }]),
  ],
  controllers: [TaxonomyController],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
