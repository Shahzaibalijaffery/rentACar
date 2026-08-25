import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RentalEventsService } from './rental-events.service';
import { RentalsController } from './rentals.controller';
import { RentalsRepository } from './rentals.repository';
import { RentalsService } from './rentals.service';

@Module({
  imports: [VehiclesModule, UsersModule, NotificationsModule],
  controllers: [RentalsController],
  providers: [RentalsRepository, RentalsService, RentalEventsService],
  exports: [RentalsService, RentalsRepository],
})
export class RentalsModule {}
