import { Injectable } from '@nestjs/common';
import type { PaginatedResponse, VehicleDiscoveryItem } from '@rentacar/shared';
import { resolveSearchRadiusKm, validateCoordinates } from '../../common/utils/location.util';
import { DISCOVERY_DEFAULT_PAGE, DISCOVERY_DEFAULT_PAGE_SIZE } from './discovery.constants';
import { assertDiscoveryItemIsPublicSafe, toVehicleDiscoveryItem } from './discovery.mapper';
import { DiscoveryRepository } from './discovery.repository';
import { DiscoverVehiclesQueryDto } from './dto/discover-vehicles.dto';

@Injectable()
export class DiscoveryService {
  constructor(private readonly discoveryRepository: DiscoveryRepository) {}

  async discoverVehicles(
    query: DiscoverVehiclesQueryDto,
    viewerUserId?: string,
  ): Promise<PaginatedResponse<VehicleDiscoveryItem>> {
    const { latitude, longitude } = validateCoordinates(query.latitude, query.longitude);
    const radiusKm = resolveSearchRadiusKm(query.radiusKm);
    const page = query.page ?? DISCOVERY_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DISCOVERY_DEFAULT_PAGE_SIZE;

    const { items, total } = await this.discoveryRepository.discoverNearby({
      latitude,
      longitude,
      radiusKm,
      page,
      pageSize,
      availability: query.availability!,
      ...(query.make !== undefined ? { make: query.make } : {}),
      ...(query.model !== undefined ? { model: query.model } : {}),
      ...(viewerUserId ? { excludeOwnerId: viewerUserId } : {}),
    });

    const data = items.map(toVehicleDiscoveryItem);
    data.forEach(assertDiscoveryItemIsPublicSafe);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
      },
    };
  }
}
