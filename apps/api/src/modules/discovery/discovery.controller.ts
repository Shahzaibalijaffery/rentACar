import { Controller, Get, Query } from '@nestjs/common';
import type { PaginatedResponse, VehicleDiscoveryItem } from '@rentacar/shared';
import { Public } from '../../common/decorators/auth.decorators';
import { OptionalCurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DiscoveryService } from './discovery.service';
import { DiscoverVehiclesQueryDto } from './dto/discover-vehicles.dto';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('vehicles')
  @Public()
  discoverVehicles(
    @Query() query: DiscoverVehiclesQueryDto,
    @OptionalCurrentUser() viewer?: AuthenticatedUser,
  ): Promise<PaginatedResponse<VehicleDiscoveryItem>> {
    return this.discoveryService.discoverVehicles(query, viewer?.userId);
  }
}
