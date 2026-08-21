import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateRentalRequest,
  RentalDetailView,
  RentalLifecycleFilter,
  RentalSummary,
} from '@rentacar/shared';
import { apiRequest } from '@/api/client';
import { agreementKeys } from '@/api/keys/agreement.keys';
import { handoverKeys } from '@/api/keys/handover.keys';
import { rentalKeys, rentalsIncomingPath, rentalsMinePath } from '@/api/keys/rental.keys';

export function useMyRentalsQuery(lifecycle: RentalLifecycleFilter = 'all', enabled = true) {
  return useQuery({
    queryKey: rentalKeys.mine(lifecycle),
    queryFn: () => apiRequest<RentalSummary[]>(rentalsMinePath(lifecycle)),
    enabled,
  });
}

export function useIncomingRentalsQuery(lifecycle: RentalLifecycleFilter = 'all', enabled = true) {
  return useQuery({
    queryKey: rentalKeys.incoming(lifecycle),
    queryFn: () => apiRequest<RentalSummary[]>(rentalsIncomingPath(lifecycle)),
    enabled,
  });
}

export function useRentalQuery(rentalId: string) {
  return useQuery({
    queryKey: rentalKeys.detail(rentalId),
    queryFn: () => apiRequest<RentalDetailView>(`/rentals/${rentalId}`),
    enabled: Boolean(rentalId),
  });
}

export function useCreateRentalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRentalRequest) =>
      apiRequest<RentalSummary>('/rentals', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}

export function useAcceptRentalMutation(rentalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<RentalDetailView>(`/rentals/${rentalId}/accept`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(rentalKeys.detail(rentalId), data);
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      void queryClient.invalidateQueries({ queryKey: agreementKeys.all });
      void queryClient.invalidateQueries({ queryKey: handoverKeys.all });
    },
  });
}

export function useRejectRentalMutation(rentalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiRequest<RentalSummary>(`/rentals/${rentalId}/reject`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(rentalKeys.detail(rentalId), data);
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}

export function useCancelRentalMutation(rentalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiRequest<RentalSummary>(`/rentals/${rentalId}/cancel`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(rentalKeys.detail(rentalId), data);
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}

export function useCompleteRentalMutation(rentalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<RentalDetailView>(`/rentals/${rentalId}/complete`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(rentalKeys.detail(rentalId), data);
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}
