import {
  getAgreementStatusLabel,
  hasUserApprovedAgreement,
} from '@/features/agreements/agreement-utils';

describe('agreement utils', () => {
  it('maps agreement statuses to readable labels', () => {
    expect(getAgreementStatusLabel('PENDING_APPROVAL')).toBe('Pending approval');
    expect(getAgreementStatusLabel('APPROVED')).toBe('Approved');
  });

  it('detects whether the current user already approved', () => {
    const agreement = {
      owner: { id: 'owner-1' },
      renter: { id: 'renter-1' },
      ownerApprovedAt: '2026-01-01T00:00:00.000Z',
      renterApprovedAt: null,
    };

    expect(hasUserApprovedAgreement(agreement, 'owner-1')).toBe(true);
    expect(hasUserApprovedAgreement(agreement, 'renter-1')).toBe(false);
  });
});
