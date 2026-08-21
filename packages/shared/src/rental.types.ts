import type { UserPublicProfile } from './auth.types';
import type { VehiclePhoto } from './vehicle.types';

export type RentalStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'AGREEMENT_PENDING'
  | 'PICKUP_PENDING'
  | 'PICKUP_APPROVAL_PENDING'
  | 'ACTIVE'
  | 'RETURN_PENDING'
  | 'RETURN_APPROVAL_PENDING'
  | 'COMPLETED'
  | 'RATED';

export type RentalVehicleSummary = {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  areaLabel: string | null;
  photos: VehiclePhoto[];
};

export type RentalSummary = {
  id: string;
  status: RentalStatus;
  vehicle: RentalVehicleSummary;
  renter: UserPublicProfile;
  owner: UserPublicProfile;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  completedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RentalDetailView = RentalSummary & {
  agreementId: string | null;
  pickupHandoverId: string | null;
};

export type RentalLifecycleFilter = 'all' | 'active' | 'completed';

export type CreateRentalRequest = {
  vehicleId: string;
  startDate?: string;
  endDate?: string;
};
