import { Module } from '@nestjs/common';
import { RentalsModule } from '../rentals/rentals.module';
import { UsersModule } from '../users/users.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { RatingsController } from './ratings.controller';
import { RatingsRepository } from './ratings.repository';
import { RatingsService } from './ratings.service';

@Module({
  imports: [RentalsModule, VehiclesModule, UsersModule],
  controllers: [RatingsController],
  providers: [RatingsRepository, RatingsService],
  exports: [RatingsService, RatingsRepository],
})
export class RatingsModule {}
