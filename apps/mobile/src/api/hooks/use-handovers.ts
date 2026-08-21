import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HandoverView } from '@rentacar/shared';
import { apiRequest } from '@/api/client';
import { apiUploadFile, type UploadFileInput } from '@/api/upload';
import { handoverKeys } from '@/api/keys/handover.keys';
import { rentalKeys } from '@/api/keys/rental.keys';

export function useHandoverQuery(handoverId: string) {
  return useQuery({
    queryKey: handoverKeys.detail(handoverId),
    queryFn: () => apiRequest<HandoverView>(`/handovers/${handoverId}`),
    enabled: Boolean(handoverId),
  });
}

export function usePickupHandoverByRentalQuery(rentalId: string, enabled = true) {
  return useQuery({
    queryKey: handoverKeys.pickupByRental(rentalId),
    queryFn: () => apiRequest<HandoverView>(`/rentals/${rentalId}/handovers/pickup`),
    enabled: Boolean(rentalId) && enabled,
    retry: false,
  });
}

export function useCreatePickupHandoverMutation(rentalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<HandoverView>(`/rentals/${rentalId}/handovers/pickup`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(handoverKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: handoverKeys.pickupByRental(rentalId) });
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}

export function useUploadHandoverPhotoMutation(handoverId: string, rentalId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: UploadFileInput) =>
      apiUploadFile<HandoverView>(`/handovers/${handoverId}/photos`, file),
    onSuccess: (data) => {
      queryClient.setQueryData(handoverKeys.detail(handoverId), data);
      void queryClient.invalidateQueries({ queryKey: handoverKeys.all });
      if (rentalId) {
        void queryClient.invalidateQueries({ queryKey: handoverKeys.pickupByRental(rentalId) });
      }
    },
  });
}

export function useDeleteHandoverPhotoMutation(handoverId: string, rentalId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) =>
      apiRequest<HandoverView>(`/handovers/${handoverId}/photos/${photoId}`, { method: 'DELETE' }),
    onSuccess: (data) => {
      queryClient.setQueryData(handoverKeys.detail(handoverId), data);
      void queryClient.invalidateQueries({ queryKey: handoverKeys.all });
      if (rentalId) {
        void queryClient.invalidateQueries({ queryKey: handoverKeys.pickupByRental(rentalId) });
      }
    },
  });
}

export function useSubmitHandoverMutation(handoverId: string, rentalId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<HandoverView>(`/handovers/${handoverId}/submit`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(handoverKeys.detail(handoverId), data);
      void queryClient.invalidateQueries({ queryKey: handoverKeys.all });
      if (rentalId) {
        void queryClient.invalidateQueries({ queryKey: handoverKeys.pickupByRental(rentalId) });
      }
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}

export function useApproveHandoverMutation(handoverId: string, rentalId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<HandoverView>(`/handovers/${handoverId}/approve`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(handoverKeys.detail(handoverId), data);
      void queryClient.invalidateQueries({ queryKey: handoverKeys.all });
      if (rentalId) {
        void queryClient.invalidateQueries({ queryKey: handoverKeys.pickupByRental(rentalId) });
      }
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}
