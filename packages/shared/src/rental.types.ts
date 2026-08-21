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

/** Limited party info on a rental request — no phone, CNIC, or email. */
export type RentalRequestProfile = {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  memberSince: string;
};

/** Visible only to the two participants after the owner accepts. */
export type RentalParticipantContact = {
  ownerPhone: string;
  renterPhone: string;
};

export type RentalDetailView = RentalSummary & {
  agreementId: string | null;
  pickupHandoverId: string | null;
  renterProfile: RentalRequestProfile;
  ownerProfile: RentalRequestProfile;
  contact: RentalParticipantContact | null;
};

export type RentalLifecycleFilter = 'all' | 'active' | 'completed';

export type CreateRentalRequest = {
  vehicleId: string;
  startDate?: string;
  endDate?: string;
};
