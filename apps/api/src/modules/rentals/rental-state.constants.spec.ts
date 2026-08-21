import { RentalStatus } from '@prisma/client';
import { canTransitionRental } from './rental-state.constants';

describe('rental state transitions', () => {
  it('lets the owner accept a pending request straight into pickup', () => {
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.PICKUP_PENDING)).toBe(true);
  });

  it('still allows reject and cancel from pending', () => {
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.REJECTED)).toBe(true);
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.CANCELLED)).toBe(true);
  });

  it('keeps the legacy agreement path for in-flight accepted rentals', () => {
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.ACCEPTED)).toBe(true);
    expect(canTransitionRental(RentalStatus.ACCEPTED, RentalStatus.AGREEMENT_PENDING)).toBe(true);
    expect(canTransitionRental(RentalStatus.AGREEMENT_PENDING, RentalStatus.PICKUP_PENDING)).toBe(
      true,
    );
  });

  it('rejects skipping pickup photos', () => {
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.ACTIVE)).toBe(false);
    expect(canTransitionRental(RentalStatus.PICKUP_PENDING, RentalStatus.ACTIVE)).toBe(false);
  });
});
