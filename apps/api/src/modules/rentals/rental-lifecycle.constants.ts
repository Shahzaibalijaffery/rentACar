import { RentalStatus } from '@prisma/client';
import type { RentalLifecycleFilter } from '@rentacar/shared';

export const ACTIVE_RENTAL_STATUSES: RentalStatus[] = [RentalStatus.ACTIVE];

export const IN_PROGRESS_RENTAL_STATUSES: RentalStatus[] = [
  RentalStatus.PENDING,
  RentalStatus.ACCEPTED,
  RentalStatus.AGREEMENT_PENDING,
  RentalStatus.PICKUP_PENDING,
  RentalStatus.PICKUP_APPROVAL_PENDING,
  RentalStatus.ACTIVE,
];

export function resolveLifecycleStatuses(
  lifecycle: RentalLifecycleFilter,
): RentalStatus[] | undefined {
  switch (lifecycle) {
    case 'active':
      return ACTIVE_RENTAL_STATUSES;
    case 'completed':
      return [RentalStatus.COMPLETED, RentalStatus.RATED];
    default:
      return undefined;
  }
}
