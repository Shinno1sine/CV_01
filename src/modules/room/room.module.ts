import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomSchema } from './entities/room.entity';
import { LayoutSchema } from './entities/layout.entity';
import { SeatSchema } from './entities/seat.entity';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'room', schema: RoomSchema },
      { name: 'layout', schema: LayoutSchema },
      { name: 'seat', schema: SeatSchema },
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
