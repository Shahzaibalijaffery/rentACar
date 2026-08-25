import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './common/database/prisma.module';
import { EmailModule } from './common/email/email.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from './common/guards/email-verified.guard';
import { StorageModule } from './common/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { AgreementsModule } from './modules/agreements/agreements.module';
import { GeocodingModule } from './modules/geocoding/geocoding.module';
import { HandoversModule } from './modules/handovers/handovers.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    EmailModule,
    StorageModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
        skipIf: (context) => context.getType() !== 'http',
      },
    ]),
    JwtModule.register({}),
    HealthModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    DiscoveryModule,
    RentalsModule,
    AgreementsModule,
    GeocodingModule,
    HandoversModule,
    RatingsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: EmailVerifiedGuard },
  ],
})
export class AppModule {}
