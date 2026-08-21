import { Module } from '@nestjs/common';
import { RentalsModule } from '../rentals/rentals.module';
import { HandoverEventsService } from './handover-events.service';
import { HandoversController } from './handovers.controller';
import { HandoversRepository } from './handovers.repository';
import { HandoversService } from './handovers.service';

@Module({
  imports: [RentalsModule],
  controllers: [HandoversController],
  providers: [HandoversRepository, HandoversService, HandoverEventsService],
  exports: [HandoversService, HandoversRepository],
})
export class HandoversModule {}
