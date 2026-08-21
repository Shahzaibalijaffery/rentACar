import { VehiclePhoto } from '@prisma/client';
import type {
  RentalDetailView,
  RentalRequestProfile,
  RentalSummary,
  RentalVehicleSummary,
} from '@rentacar/shared';
import { toUserPublicProfile } from '../users/user.mapper';
import { CONTACT_VISIBLE_STATUSES } from './rental-state.constants';
import type { RentalRecord } from './rentals.repository';

type RentalWithRelations = RentalRecord;

function toVehicleSummary(vehicle: RentalWithRelations['vehicle']): RentalVehicleSummary {
  const photos = [...vehicle.photos]
    .sort((a: VehiclePhoto, b: VehiclePhoto) => a.sortOrder - b.sortOrder)
    .map((photo) => ({
      id: photo.id,
      url: photo.url,
      mimeType: photo.mimeType,
      sortOrder: photo.sortOrder,
    }));

  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    areaLabel: vehicle.areaLabel,
    photos,
  };
}

function toRequestProfile(
  user: RentalWithRelations['renter'] | RentalWithRelations['owner'],
): RentalRequestProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    profilePhotoUrl: user.profilePhotoUrl,
    memberSince: user.createdAt.toISOString(),
  };
}

export function toRentalSummary(rental: RentalWithRelations): RentalSummary {
  return {
    id: rental.id,
    status: rental.status,
    vehicle: toVehicleSummary(rental.vehicle),
    renter: toUserPublicProfile(rental.renter),
    owner: toUserPublicProfile(rental.owner),
    startDate: rental.startDate?.toISOString() ?? null,
    endDate: rental.endDate?.toISOString() ?? null,
    completedAt: rental.completedAt?.toISOString() ?? null,
    completedById: rental.completedById ?? null,
    createdAt: rental.createdAt.toISOString(),
    updatedAt: rental.updatedAt.toISOString(),
  };
}

export function toRentalDetailView(
  rental: RentalWithRelations,
  related: { agreementId: string | null; pickupHandoverId: string | null },
): RentalDetailView {
  const contactVisible = CONTACT_VISIBLE_STATUSES.includes(rental.status);

  return {
    ...toRentalSummary(rental),
    agreementId: related.agreementId,
    pickupHandoverId: related.pickupHandoverId,
    renterProfile: toRequestProfile(rental.renter),
    ownerProfile: toRequestProfile(rental.owner),
    contact: contactVisible
      ? {
          ownerPhone: rental.owner.phone,
          renterPhone: rental.renter.phone,
        }
      : null,
  };
}

export function assertRentalSummaryIsPublicSafe(summary: RentalSummary): void {
  const serialized = JSON.stringify({
    renter: summary.renter,
    owner: summary.owner,
  });
  if (/cnic|email|phone/i.test(serialized)) {
    throw new Error('Rental summary leaked private user fields');
  }
}

export function assertRentalDetailIsSafe(detail: RentalDetailView): void {
  assertRentalSummaryIsPublicSafe(detail);

  const profiles = JSON.stringify({
    renterProfile: detail.renterProfile,
    ownerProfile: detail.ownerProfile,
  });
  if (/cnic|email|phone/i.test(profiles)) {
    throw new Error('Rental request profile leaked private user fields');
  }

  const contactExpected = CONTACT_VISIBLE_STATUSES.includes(detail.status);
  if (contactExpected && !detail.contact) {
    throw new Error('Accepted rental is missing participant contact');
  }
  if (!contactExpected && detail.contact) {
    throw new Error('Pending rental leaked participant contact');
  }
}
