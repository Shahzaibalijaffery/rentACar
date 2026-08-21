import { VehiclePhoto } from '@prisma/client';
import type { HandoverView } from '@rentacar/shared';
import type { HandoverRecord } from './handovers.repository';

function toVehicleSummary(vehicle: HandoverRecord['rental']['vehicle']) {
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

export function toHandoverView(handover: HandoverRecord): HandoverView {
  return {
    id: handover.id,
    rentalId: handover.rentalId,
    type: handover.type,
    status: handover.status,
    vehicle: toVehicleSummary(handover.rental.vehicle),
    owner: {
      id: handover.owner.id,
      fullName: handover.owner.fullName,
    },
    renter: {
      id: handover.renter.id,
      fullName: handover.renter.fullName,
    },
    photos: handover.photos
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        id: photo.id,
        url: photo.url,
        mimeType: photo.mimeType,
        sortOrder: photo.sortOrder,
        uploadedById: photo.uploadedById,
        createdAt: photo.createdAt.toISOString(),
      })),
    approvals: handover.approvals.map((approval) => ({
      id: approval.id,
      approvedById: approval.approvedById,
      role: approval.role as 'RENTER' | 'OWNER',
      approvedAt: approval.approvedAt.toISOString(),
    })),
    submittedAt: handover.submittedAt?.toISOString() ?? null,
    createdAt: handover.createdAt.toISOString(),
    updatedAt: handover.updatedAt.toISOString(),
  };
}
