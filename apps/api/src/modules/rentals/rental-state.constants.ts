import { RentalStatus } from '@prisma/client';

/** Rentals in these statuses block new requests for the same vehicle. */
export const BLOCKING_RENTAL_STATUSES: RentalStatus[] = [
  RentalStatus.PENDING,
  RentalStatus.ACCEPTED,
  RentalStatus.AGREEMENT_PENDING,
  RentalStatus.PICKUP_PENDING,
  RentalStatus.PICKUP_APPROVAL_PENDING,
  RentalStatus.ACTIVE,
];

/** Explicit transition table — only listed targets are allowed from each source state. */
export const RENTAL_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  [RentalStatus.PENDING]: [RentalStatus.ACCEPTED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
  [RentalStatus.ACCEPTED]: [RentalStatus.AGREEMENT_PENDING],
  [RentalStatus.REJECTED]: [],
  [RentalStatus.CANCELLED]: [],
  [RentalStatus.AGREEMENT_PENDING]: [RentalStatus.PICKUP_PENDING, RentalStatus.ACCEPTED],
  [RentalStatus.PICKUP_PENDING]: [RentalStatus.PICKUP_APPROVAL_PENDING],
  [RentalStatus.PICKUP_APPROVAL_PENDING]: [RentalStatus.ACTIVE],
  [RentalStatus.ACTIVE]: [RentalStatus.COMPLETED],
  [RentalStatus.RETURN_PENDING]: [],
  [RentalStatus.RETURN_APPROVAL_PENDING]: [],
  [RentalStatus.COMPLETED]: [],
  [RentalStatus.RATED]: [],
};

export function canTransitionRental(from: RentalStatus, to: RentalStatus): boolean {
  return RENTAL_TRANSITIONS[from]?.includes(to) ?? false;
}
