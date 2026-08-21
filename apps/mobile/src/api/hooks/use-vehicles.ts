import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VehicleAvailability, VehicleOwnerView } from '@rentacar/shared';
import { apiRequest } from '@/api/client';
import { apiUploadFile } from '@/api/upload';
import { vehicleKeys } from '@/api/keys/vehicle.keys';

export type VehicleFormInput = {
  make: string;
  model: string;
  year: number;
  color: string;
  latitude: number;
  longitude: number;
  areaLabel?: string;
};

export function useMyVehiclesQuery(includeArchived = false) {
  return useQuery({
    queryKey: vehicleKeys.mine(includeArchived),
    queryFn: () =>
      apiRequest<VehicleOwnerView[]>(
        `/vehicles/mine${includeArchived ? '?includeArchived=true' : ''}`,
      ),
  });
}

export function useVehicleQuery(vehicleId: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(vehicleId),
    queryFn: () => apiRequest<VehicleOwnerView>(`/vehicles/${vehicleId}`),
    enabled: Boolean(vehicleId),
  });
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VehicleFormInput) =>
      apiRequest<VehicleOwnerView>('/vehicles', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}

export function useUpdateVehicleMutation(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<VehicleFormInput>) =>
      apiRequest<VehicleOwnerView>(`/vehicles/${vehicleId}`, { method: 'PATCH', body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(vehicleKeys.detail(vehicleId), data);
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}

export function useArchiveVehicleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicleId: string) =>
      apiRequest<{ message: string }>(`/vehicles/${vehicleId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}

export function useUpdateAvailabilityMutation(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (availability: VehicleAvailability) =>
      apiRequest<VehicleOwnerView>(`/vehicles/${vehicleId}/availability`, {
        method: 'PATCH',
        body: { availability },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(vehicleKeys.detail(vehicleId), data);
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}

export function useUploadVehiclePhotoMutation(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: { uri: string; type: string; name: string }) =>
      apiUploadFile<VehicleOwnerView>(`/vehicles/${vehicleId}/photos`, file),
    onSuccess: (data) => {
      queryClient.setQueryData(vehicleKeys.detail(vehicleId), data);
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}

export function useDeleteVehiclePhotoMutation(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) =>
      apiRequest<VehicleOwnerView>(`/vehicles/${vehicleId}/photos/${photoId}`, {
        method: 'DELETE',
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(vehicleKeys.detail(vehicleId), data);
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}
