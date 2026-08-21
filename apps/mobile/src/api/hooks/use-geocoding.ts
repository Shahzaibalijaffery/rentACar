import { useQuery } from '@tanstack/react-query';
import type { AreaSearchResult } from '@rentacar/shared';
import { apiRequest } from '@/api/client';

export const geocodingKeys = {
  areas: (query: string) => ['geocoding', 'areas', query] as const,
};

export function useAreaSearchQuery(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: geocodingKeys.areas(trimmed),
    queryFn: () =>
      apiRequest<AreaSearchResult[]>(`/geocoding/areas?q=${encodeURIComponent(trimmed)}`),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });
}

export async function reverseGeocodeArea(
  latitude: number,
  longitude: number,
): Promise<AreaSearchResult> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  return apiRequest<AreaSearchResult>(`/geocoding/reverse?${params.toString()}`);
}
