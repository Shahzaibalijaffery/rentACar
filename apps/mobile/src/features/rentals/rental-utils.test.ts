import { formatRentalDate, getRentalStatusLabel } from '@/features/rentals/rental-utils';

describe('rental utils', () => {
  it('maps rental statuses to readable labels', () => {
    expect(getRentalStatusLabel('PENDING')).toBe('Pending');
    expect(getRentalStatusLabel('ACCEPTED')).toBe('Accepted');
  });

  it('formats rental dates and handles missing values', () => {
    expect(formatRentalDate(null)).toBe('Not specified');
    expect(formatRentalDate('2026-02-01T00:00:00.000Z')).toEqual(expect.any(String));
  });
});
