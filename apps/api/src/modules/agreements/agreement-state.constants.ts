import { AgreementStatus } from '@prisma/client';

export const AGREEMENT_TRANSITIONS: Record<AgreementStatus, AgreementStatus[]> = {
  [AgreementStatus.DRAFT]: [AgreementStatus.PENDING_APPROVAL, AgreementStatus.CANCELLED],
  [AgreementStatus.PENDING_APPROVAL]: [AgreementStatus.APPROVED, AgreementStatus.CANCELLED],
  [AgreementStatus.APPROVED]: [],
  [AgreementStatus.CANCELLED]: [],
};

export const APPROVABLE_AGREEMENT_STATUSES: AgreementStatus[] = [AgreementStatus.PENDING_APPROVAL];

export const CANCELLABLE_AGREEMENT_STATUSES: AgreementStatus[] = [
  AgreementStatus.DRAFT,
  AgreementStatus.PENDING_APPROVAL,
];

export function canTransitionAgreement(from: AgreementStatus, to: AgreementStatus): boolean {
  return AGREEMENT_TRANSITIONS[from]?.includes(to) ?? false;
}
