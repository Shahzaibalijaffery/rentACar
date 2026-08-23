import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateRatingRequest,
  PublicRatingListView,
  RentalRatingsView,
} from '@rentacar/shared';
import { apiRequest } from '@/api/client';
import { discoveryKeys } from '@/api/keys/discovery.keys';
import { ratingKeys } from '@/api/keys/rating.keys';
import { rentalKeys } from '@/api/keys/rental.keys';
import { vehicleKeys } from '@/api/keys/vehicle.keys';

export function useRentalRatingsQuery(rentalId: string, enabled = true) {
  return useQuery({
    queryKey: ratingKeys.rental(rentalId),
    queryFn: () => apiRequest<RentalRatingsView>(`/rentals/${rentalId}/ratings`),
    enabled: enabled && Boolean(rentalId),
  });
}

export function useVehicleRatingsQuery(vehicleId: string, enabled = true) {
  return useQuery({
    queryKey: ratingKeys.vehicle(vehicleId),
    queryFn: () => apiRequest<PublicRatingListView>(`/vehicles/${vehicleId}/ratings`, { auth: false }),
    enabled: enabled && Boolean(vehicleId),
  });
}

export function useRenterRatingsQuery(userId: string, enabled = true) {
  return useQuery({
    queryKey: ratingKeys.renter(userId),
    queryFn: () =>
      apiRequest<PublicRatingListView>(`/users/${userId}/renter-ratings`, { auth: false }),
    enabled: enabled && Boolean(userId),
  });
}

export function useSubmitRentalRatingMutation(rentalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRatingRequest) =>
      apiRequest<RentalRatingsView>(`/rentals/${rentalId}/ratings`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(ratingKeys.rental(rentalId), data);
      void queryClient.invalidateQueries({ queryKey: rentalKeys.detail(rentalId) });
      void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      void queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      void queryClient.invalidateQueries({ queryKey: discoveryKeys.all });
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}
