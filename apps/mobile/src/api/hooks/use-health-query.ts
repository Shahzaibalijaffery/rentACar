import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import { healthKeys } from '@/api/keys/health.keys';

type HealthStatus = {
  status: 'ok';
  database: 'connected' | 'disconnected';
};

export function useHealthQuery() {
  return useQuery({
    queryKey: healthKeys.status(),
    queryFn: () => apiRequest<HealthStatus>('/health'),
    staleTime: 30_000,
  });
}
