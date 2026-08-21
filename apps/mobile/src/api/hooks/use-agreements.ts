import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateRentalAgreementRequest, RentalAgreementView } from '@rentacar/shared';
import { apiRequest } from '@/api/client';
import { agreementKeys } from '@/api/keys/agreement.keys';
import { rentalKeys } from '@/api/keys/rental.keys';

export function useAgreementQuery(agreementId: string) {
  return useQuery({
    queryKey: agreementKeys.detail(agreementId),
    queryFn: () => apiRequest<RentalAgreementView>(`/agreements/${agreementId}`),
    enabled: Boolean(agreementId),
  });
}

export function useAgreementByRentalQuery(rentalId: string, enabled = true) {
  return useQuery({
    queryKey: agreementKeys.byRental(rentalId),
    queryFn: () => apiRequest<RentalAgreementView>(`/rentals/${rentalId}/agreement`),
    enabled: Boolean(rentalId) && enabled,
    retry: false,
  });
}

export function useCreateAgreementMutation(rentalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRentalAgreementRequest) =>
      apiRequest<RentalAgreementView>(`/rentals/${rentalId}/agreement`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(agreementKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: agreementKeys.byRental(rentalId) });
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}

export function useApproveAgreementMutation(agreementId: string, rentalId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<RentalAgreementView>(`/agreements/${agreementId}/approve`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(agreementKeys.detail(agreementId), data);
      void queryClient.invalidateQueries({ queryKey: agreementKeys.all });
      if (rentalId) {
        void queryClient.invalidateQueries({ queryKey: agreementKeys.byRental(rentalId) });
      }
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}

export function useCancelAgreementMutation(agreementId: string, rentalId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<RentalAgreementView>(`/agreements/${agreementId}/cancel`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(agreementKeys.detail(agreementId), data);
      void queryClient.invalidateQueries({ queryKey: agreementKeys.all });
      if (rentalId) {
        void queryClient.invalidateQueries({ queryKey: agreementKeys.byRental(rentalId) });
      }
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}
