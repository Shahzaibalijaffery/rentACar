import type { AgreementAuditAction } from '@rentacar/shared';

export type AgreementEventType =
  | 'AGREEMENT_CREATED'
  | 'AGREEMENT_OWNER_APPROVED'
  | 'AGREEMENT_RENTER_APPROVED'
  | 'AGREEMENT_FULLY_APPROVED'
  | 'AGREEMENT_CANCELLED';

export type AgreementEventPayload = {
  agreementId: string;
  rentalId: string;
  ownerId: string;
  renterId: string;
  vehicleId: string;
  status: string;
};

export const AUDIT_ACTION_MAP: Record<AgreementEventType, AgreementAuditAction | null> = {
  AGREEMENT_CREATED: 'AGREEMENT_CREATED',
  AGREEMENT_OWNER_APPROVED: 'AGREEMENT_OWNER_APPROVED',
  AGREEMENT_RENTER_APPROVED: 'AGREEMENT_RENTER_APPROVED',
  AGREEMENT_FULLY_APPROVED: null,
  AGREEMENT_CANCELLED: 'AGREEMENT_CANCELLED',
};
