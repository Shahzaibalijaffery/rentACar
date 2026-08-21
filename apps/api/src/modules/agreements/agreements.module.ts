import { Module } from '@nestjs/common';
import { RentalsModule } from '../rentals/rentals.module';
import { AgreementEventsService } from './agreement-events.service';
import { AgreementsController } from './agreements.controller';
import { AgreementsRepository } from './agreements.repository';
import { AgreementsService } from './agreements.service';

@Module({
  imports: [RentalsModule],
  controllers: [AgreementsController],
  providers: [AgreementsRepository, AgreementsService, AgreementEventsService],
  exports: [AgreementsService, AgreementsRepository],
})
export class AgreementsModule {}
