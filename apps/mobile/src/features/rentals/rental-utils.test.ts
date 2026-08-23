import {
  formatRentalDate,
  getRentalNextStep,
  getRentalStatusLabel,
} from '@/features/rentals/rental-utils';

describe('rental utils', () => {
  it('maps rental statuses to readable labels', () => {
    expect(getRentalStatusLabel('PENDING')).toBe('Pending');
    expect(getRentalStatusLabel('ACCEPTED')).toBe('Accepted');
    expect(getRentalStatusLabel('PICKUP_PENDING')).toBe('Pickup pending');
  });

  it('formats rental dates and handles missing values', () => {
    expect(formatRentalDate(null)).toBe('Not specified');
    expect(formatRentalDate('2026-02-01T00:00:00.000Z')).toEqual(expect.any(String));
  });

  it('tells the owner that accepting starts pickup', () => {
    expect(
      getRentalNextStep({
        status: 'PENDING',
        perspective: 'owner',
        hasAgreement: false,
        userApprovedAgreement: false,
        agreementFullyApproved: false,
      }),
    ).toEqual({
      title: 'Review request',
      description: 'View the renter profile, then accept or reject this request.',
    });
  });

  it('tells both parties to call after accept', () => {
    expect(
      getRentalNextStep({
        status: 'ACCEPTED',
        perspective: 'owner',
        hasAgreement: true,
        userApprovedAgreement: true,
        agreementFullyApproved: true,
      }),
    ).toEqual({
      title: 'Call the renter',
      description: 'Arrange pickup by phone, then start handover photos when you meet.',
    });
  });

  it('asks both parties to rate after the rental is completed', () => {
    expect(
      getRentalNextStep({
        status: 'COMPLETED',
        perspective: 'renter',
        hasAgreement: true,
        userApprovedAgreement: true,
        agreementFullyApproved: true,
      }),
    ).toEqual({
      title: 'Rate this car',
      description: 'Tap the stars below. This shows on the car.',
    });
  });
});
