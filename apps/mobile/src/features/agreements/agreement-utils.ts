import { DEFAULT_RENTAL_AGREEMENT_TERMS, type AgreementStatus } from '@rentacar/shared';

export function getAgreementStatusLabel(status: AgreementStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PENDING_APPROVAL':
      return 'Pending approval';
    case 'APPROVED':
      return 'Approved';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export function hasUserApprovedAgreement(
  agreement: {
    owner: { id: string };
    renter: { id: string };
    ownerApprovedAt: string | null;
    renterApprovedAt: string | null;
  },
  userId: string,
): boolean {
  if (agreement.owner.id === userId) {
    return Boolean(agreement.ownerApprovedAt);
  }
  if (agreement.renter.id === userId) {
    return Boolean(agreement.renterApprovedAt);
  }
  return false;
}

export const DEFAULT_AGREEMENT_TERMS = DEFAULT_RENTAL_AGREEMENT_TERMS;
