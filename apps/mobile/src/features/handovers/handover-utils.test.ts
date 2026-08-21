import {
  getHandoverStatusLabel,
  MIN_PICKUP_HANDOVER_PHOTOS,
} from '@/features/handovers/handover-utils';

describe('handover utils', () => {
  it('maps handover statuses to readable labels', () => {
    expect(getHandoverStatusLabel('OWNER_PHOTOS_REQUIRED')).toBe('Owner photos required');
    expect(getHandoverStatusLabel('APPROVED')).toBe('Approved');
  });

  it('exposes the minimum pickup photo requirement', () => {
    expect(MIN_PICKUP_HANDOVER_PHOTOS).toBeGreaterThan(0);
  });
});
