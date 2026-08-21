import type { DiscoverVehiclesQuery } from '@rentacar/shared';

export const discoveryKeys = {
  all: ['discovery'] as const,
  search: (params: DiscoverVehiclesQuery & { pageSize: number }) =>
    [...discoveryKeys.all, 'search', params] as const,
};
