import { VehiclePhoto } from '@prisma/client';
import type { RentalDetailView, RentalSummary, RentalVehicleSummary } from '@rentacar/shared';
import { toUserPublicProfile } from '../users/user.mapper';
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
  return {
    ...toRentalSummary(rental),
    agreementId: related.agreementId,
    pickupHandoverId: related.pickupHandoverId,
  };
}

export function assertRentalSummaryIsPublicSafe(summary: RentalSummary): void {
  const serialized = JSON.stringify(summary);
  if (serialized.includes('cnic') || serialized.includes('email')) {
    throw new Error('Rental summary leaked private user fields');
  }
}
