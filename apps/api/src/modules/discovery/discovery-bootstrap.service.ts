import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryRepository } from './discovery.repository';

@Injectable()
export class DiscoveryBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(DiscoveryBootstrapService.name);

  constructor(private readonly discoveryRepository: DiscoveryRepository) {}

  async onModuleInit(): Promise<void> {
    await this.discoveryRepository.ensureGeoSpatialIndex();
    await this.discoveryRepository.backfillVehicleLocations();
    this.logger.log('Discovery geospatial index and location backfill completed');
  }
}
