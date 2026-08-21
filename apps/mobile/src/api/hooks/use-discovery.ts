import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type {
  DiscoverVehiclesQuery,
  VehicleDiscoveryItem,
  VehiclePublicView,
} from '@rentacar/shared';
import { apiRequest, apiRequestPaginated } from '@/api/client';
import { discoveryKeys } from '@/api/keys/discovery.keys';
import { buildDiscoveryQueryString } from '@/features/discovery/discovery-query';

const DEFAULT_PAGE_SIZE = 20;

export type DiscoverySearchParams = DiscoverVehiclesQuery & {
  pageSize?: number;
  enabled?: boolean;
};

export function useDiscoveryInfiniteQuery(params: DiscoverySearchParams) {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const enabled =
    params.enabled !== false &&
    Number.isFinite(params.latitude) &&
    Number.isFinite(params.longitude);

  return useInfiniteQuery({
    queryKey: discoveryKeys.search({ ...params, pageSize }),
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiRequestPaginated<VehicleDiscoveryItem>(
        `/discovery/vehicles?${buildDiscoveryQueryString({
          latitude: params.latitude,
          longitude: params.longitude,
          radiusKm: params.radiusKm,
          make: params.make,
          model: params.model,
          availability: params.availability ?? 'AVAILABLE',
          page: pageParam,
          pageSize,
        })}`,
      ),
    getNextPageParam: (lastPage) => {
      const { page, pageSize: size, total } = lastPage.meta;
      return page * size < total ? page + 1 : undefined;
    },
  });
}

export function usePublicVehicleQuery(vehicleId: string, enabled = true) {
  return useQuery({
    queryKey: ['vehicles', 'public', vehicleId],
    queryFn: () => apiRequest<VehiclePublicView>(`/vehicles/${vehicleId}/public`, { auth: false }),
    enabled: enabled && Boolean(vehicleId),
  });
}
