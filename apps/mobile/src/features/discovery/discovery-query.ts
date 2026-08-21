import type { DiscoverVehiclesQuery } from '@rentacar/shared';

export function buildDiscoveryQueryString(
  params: DiscoverVehiclesQuery & { page: number; pageSize: number },
): string {
  const search = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  if (params.radiusKm !== undefined) {
    search.set('radiusKm', String(params.radiusKm));
  }

  if (params.make?.trim()) {
    search.set('make', params.make.trim());
  }

  if (params.model?.trim()) {
    search.set('model', params.model.trim());
  }

  if (params.availability) {
    search.set('availability', params.availability);
  }

  return search.toString();
}
