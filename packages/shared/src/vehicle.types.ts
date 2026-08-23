import type { RatingSummary } from './rating.types';

export type VehicleAvailability = 'AVAILABLE' | 'UNAVAILABLE';
export type VehicleStatus = 'ACTIVE' | 'ARCHIVED';

export type VehiclePhoto = {
  id: string;
  url: string;
  mimeType: string;
  sortOrder: number;
};

export type VehicleOwnerView = {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  availability: VehicleAvailability;
  status: VehicleStatus;
  latitude: number;
  longitude: number;
  areaLabel: string | null;
  photos: VehiclePhoto[];
  rating: RatingSummary;
  createdAt: string;
  updatedAt: string;
};

export type VehiclePublicView = {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  availability: VehicleAvailability;
  areaLabel: string | null;
  photos: VehiclePhoto[];
  rating: RatingSummary;
  owner: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
  };
};

export type UpdateProfileRequest = {
  fullName?: string;
  profilePhotoUrl?: string | null;
};
