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
      title: 'Accept request',
      description: 'Accepting confirms the rental terms and starts vehicle pickup.',
    });
  });

  it('tells the renter pickup follows owner accept', () => {
    expect(
      getRentalNextStep({
        status: 'PENDING',
        perspective: 'renter',
        hasAgreement: false,
        userApprovedAgreement: false,
        agreementFullyApproved: false,
      }),
    ).toEqual({
      title: 'Waiting for owner',
      description: 'If the owner accepts, you go straight to pickup photos.',
    });
  });
});
