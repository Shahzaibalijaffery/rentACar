import type { RentalStatus } from '@rentacar/shared';

export type RentalEventType =
  | 'RENTAL_CREATED'
  | 'RENTAL_ACCEPTED'
  | 'RENTAL_REJECTED'
  | 'RENTAL_CANCELLED'
  | 'RENTAL_COMPLETED';

export type RentalEventPayload = {
  rentalId: string;
  renterId: string;
  ownerId: string;
  vehicleId: string;
  status: RentalStatus;
  actorId?: string;
  completedById?: string;
  completedAt?: string;
};
