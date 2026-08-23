import { RentalStatus } from '@prisma/client';

/** Same renter cannot have another in-flight request/rental for the same vehicle. */
export const BLOCKING_RENTAL_STATUSES: RentalStatus[] = [
  RentalStatus.PENDING,
  RentalStatus.ACCEPTED,
  RentalStatus.AGREEMENT_PENDING,
  RentalStatus.PICKUP_PENDING,
  RentalStatus.PICKUP_APPROVAL_PENDING,
  RentalStatus.ACTIVE,
];

/** Vehicle is committed — other renters may still request, but cannot be accepted. */
export const COMMITTED_RENTAL_STATUSES: RentalStatus[] = [
  RentalStatus.ACCEPTED,
  RentalStatus.AGREEMENT_PENDING,
  RentalStatus.PICKUP_PENDING,
  RentalStatus.PICKUP_APPROVAL_PENDING,
  RentalStatus.ACTIVE,
];

export const PARTICIPANT_CANCELLABLE_STATUSES: RentalStatus[] = [
  RentalStatus.PENDING,
  RentalStatus.ACCEPTED,
  RentalStatus.AGREEMENT_PENDING,
  RentalStatus.PICKUP_PENDING,
  RentalStatus.PICKUP_APPROVAL_PENDING,
  RentalStatus.ACTIVE,
];

export const CONTACT_VISIBLE_STATUSES: RentalStatus[] = [
  ...COMMITTED_RENTAL_STATUSES,
  RentalStatus.COMPLETED,
  RentalStatus.RATED,
];

/** Explicit transition table — only listed targets are allowed from each source state. */
export const RENTAL_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  [RentalStatus.PENDING]: [RentalStatus.ACCEPTED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
  [RentalStatus.ACCEPTED]: [
    RentalStatus.AGREEMENT_PENDING,
    RentalStatus.PICKUP_PENDING,
    RentalStatus.CANCELLED,
  ],
  [RentalStatus.REJECTED]: [],
  [RentalStatus.CANCELLED]: [],
  [RentalStatus.AGREEMENT_PENDING]: [
    RentalStatus.PICKUP_PENDING,
    RentalStatus.ACCEPTED,
    RentalStatus.CANCELLED,
  ],
  [RentalStatus.PICKUP_PENDING]: [RentalStatus.PICKUP_APPROVAL_PENDING, RentalStatus.CANCELLED],
  [RentalStatus.PICKUP_APPROVAL_PENDING]: [RentalStatus.ACTIVE, RentalStatus.CANCELLED],
  [RentalStatus.ACTIVE]: [RentalStatus.COMPLETED, RentalStatus.CANCELLED],
  [RentalStatus.RETURN_PENDING]: [],
  [RentalStatus.RETURN_APPROVAL_PENDING]: [],
  [RentalStatus.COMPLETED]: [RentalStatus.RATED],
  [RentalStatus.RATED]: [],
};

export function canTransitionRental(from: RentalStatus, to: RentalStatus): boolean {
  return RENTAL_TRANSITIONS[from]?.includes(to) ?? false;
}
