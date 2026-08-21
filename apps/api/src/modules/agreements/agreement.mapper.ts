import { VehiclePhoto } from '@prisma/client';
import type { AgreementAuditEntry, RentalAgreementView } from '@rentacar/shared';
import type { AgreementRecord } from './agreements.repository';

function toAgreementParticipant(user: {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  cnic: string;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    profilePhotoUrl: user.profilePhotoUrl,
    cnic: user.cnic,
  };
}

function toVehicleSummary(vehicle: AgreementRecord['rental']['vehicle']) {
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

export function toRentalAgreementView(agreement: AgreementRecord): RentalAgreementView {
  const useApprovedSnapshot = agreement.status === 'APPROVED';

  return {
    id: agreement.id,
    rentalId: agreement.rentalId,
    status: agreement.status,
    version: agreement.version,
    terms: useApprovedSnapshot ? agreement.approvedTerms : agreement.terms,
    vehicle: toVehicleSummary(agreement.rental.vehicle),
    owner: toAgreementParticipant({
      id: agreement.owner.id,
      fullName: agreement.owner.fullName,
      profilePhotoUrl: agreement.owner.profilePhotoUrl,
      cnic:
        useApprovedSnapshot && agreement.ownerCnicSnapshot
          ? agreement.ownerCnicSnapshot
          : agreement.owner.cnic,
    }),
    renter: toAgreementParticipant({
      id: agreement.renter.id,
      fullName: agreement.renter.fullName,
      profilePhotoUrl: agreement.renter.profilePhotoUrl,
      cnic:
        useApprovedSnapshot && agreement.renterCnicSnapshot
          ? agreement.renterCnicSnapshot
          : agreement.renter.cnic,
    }),
    startDate:
      (useApprovedSnapshot ? agreement.approvedStartDate : agreement.startDate)?.toISOString() ??
      null,
    endDate:
      (useApprovedSnapshot ? agreement.approvedEndDate : agreement.endDate)?.toISOString() ?? null,
    ownerApprovedAt: agreement.ownerApprovedAt?.toISOString() ?? null,
    renterApprovedAt: agreement.renterApprovedAt?.toISOString() ?? null,
    createdAt: agreement.createdAt.toISOString(),
    updatedAt: agreement.updatedAt.toISOString(),
  };
}

export function toAgreementAuditEntry(entry: {
  id: string;
  agreementId: string;
  actorId: string;
  action: string;
  createdAt: Date;
}): AgreementAuditEntry {
  return {
    id: entry.id,
    agreementId: entry.agreementId,
    actorId: entry.actorId,
    action: entry.action as AgreementAuditEntry['action'],
    createdAt: entry.createdAt.toISOString(),
  };
}

export function assertAgreementViewParticipantOnly(
  view: RentalAgreementView,
  viewerId: string,
): void {
  if (view.owner.id !== viewerId && view.renter.id !== viewerId) {
    throw new Error('Agreement view leaked to non-participant');
  }
}
