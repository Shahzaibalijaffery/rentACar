import { RentalStatus } from '@prisma/client';
import { canTransitionRental } from './rental-state.constants';

describe('rental state transitions', () => {
  it('lets the owner accept a pending request', () => {
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.ACCEPTED)).toBe(true);
  });

  it('still allows reject and cancel from pending', () => {
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.REJECTED)).toBe(true);
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.CANCELLED)).toBe(true);
  });

  it('starts pickup handover from accepted, not from pending', () => {
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.PICKUP_PENDING)).toBe(false);
    expect(canTransitionRental(RentalStatus.ACCEPTED, RentalStatus.PICKUP_PENDING)).toBe(true);
  });

  it('keeps the legacy agreement path for in-flight accepted rentals', () => {
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.ACCEPTED)).toBe(true);
    expect(canTransitionRental(RentalStatus.ACCEPTED, RentalStatus.AGREEMENT_PENDING)).toBe(true);
    expect(canTransitionRental(RentalStatus.AGREEMENT_PENDING, RentalStatus.PICKUP_PENDING)).toBe(
      true,
    );
  });

  it('lets either participant cancel after the request is accepted', () => {
    expect(canTransitionRental(RentalStatus.ACCEPTED, RentalStatus.CANCELLED)).toBe(true);
    expect(canTransitionRental(RentalStatus.PICKUP_PENDING, RentalStatus.CANCELLED)).toBe(true);
    expect(canTransitionRental(RentalStatus.PICKUP_APPROVAL_PENDING, RentalStatus.CANCELLED)).toBe(
      true,
    );
    expect(canTransitionRental(RentalStatus.ACTIVE, RentalStatus.CANCELLED)).toBe(true);
    expect(canTransitionRental(RentalStatus.COMPLETED, RentalStatus.CANCELLED)).toBe(false);
  });

  it('moves a completed rental to rated after both parties submit', () => {
    expect(canTransitionRental(RentalStatus.COMPLETED, RentalStatus.RATED)).toBe(true);
    expect(canTransitionRental(RentalStatus.RATED, RentalStatus.COMPLETED)).toBe(false);
  });

  it('rejects skipping pickup photos', () => {
    expect(canTransitionRental(RentalStatus.PENDING, RentalStatus.ACTIVE)).toBe(false);
    expect(canTransitionRental(RentalStatus.PICKUP_PENDING, RentalStatus.ACTIVE)).toBe(false);
  });
});
