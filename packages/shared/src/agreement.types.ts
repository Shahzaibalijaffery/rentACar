import type { RentalVehicleSummary } from './rental.types';

export type AgreementStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'CANCELLED';

/** Participant identity inside an agreement — includes CNIC (agreement context only). */
export type AgreementParticipant = {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  cnic: string;
};

export type RentalAgreementView = {
  id: string;
  rentalId: string;
  status: AgreementStatus;
  version: number;
  terms: string | null;
  vehicle: RentalVehicleSummary;
  owner: AgreementParticipant;
  renter: AgreementParticipant;
  startDate: string | null;
  endDate: string | null;
  ownerApprovedAt: string | null;
  renterApprovedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateRentalAgreementRequest = {
  terms: string;
  startDate?: string;
  endDate?: string;
};

/** Standard terms applied when the owner accepts a rental request. */
export const DEFAULT_RENTAL_AGREEMENT_TERMS =
  'Both parties agree to use the vehicle responsibly during the rental period, return it in the same general condition, and follow applicable traffic laws. Payment arrangements are handled separately outside this app.';

export type AgreementAuditAction =
  | 'AGREEMENT_CREATED'
  | 'AGREEMENT_OWNER_APPROVED'
  | 'AGREEMENT_RENTER_APPROVED'
  | 'AGREEMENT_CANCELLED';

export type AgreementAuditEntry = {
  id: string;
  agreementId: string;
  actorId: string;
  action: AgreementAuditAction;
  createdAt: string;
};
