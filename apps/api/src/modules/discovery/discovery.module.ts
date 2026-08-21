import { Module } from '@nestjs/common';
import { DiscoveryBootstrapService } from './discovery-bootstrap.service';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryRepository } from './discovery.repository';
import { DiscoveryService } from './discovery.service';

@Module({
  controllers: [DiscoveryController],
  providers: [DiscoveryRepository, DiscoveryService, DiscoveryBootstrapService],
  exports: [DiscoveryService, DiscoveryRepository],
})
export class DiscoveryModule {}
