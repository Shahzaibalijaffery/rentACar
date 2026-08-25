import { DEFAULT_RENTAL_AGREEMENT_TERMS, type AgreementStatus } from '@rentacar/shared';
import { i18n } from '@/i18n';

export function getAgreementStatusLabel(status: AgreementStatus): string {
  return i18n.t(`agreements:status.${status}`, { defaultValue: status });
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
