import type { UserPublicProfile } from './auth.types';
import type { RatingSummary } from './rating.types';
import type { VehicleAvailability, VehiclePhoto } from './vehicle.types';

export type VehicleDiscoveryItem = {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  availability: VehicleAvailability;
  areaLabel: string | null;
  photos: VehiclePhoto[];
  rating: RatingSummary;
  distanceMeters: number;
  distanceLabel: string;
  owner: UserPublicProfile;
};

export type DiscoverVehiclesQuery = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  page?: number;
  pageSize?: number;
  make?: string;
  model?: string;
  availability?: VehicleAvailability;
};
