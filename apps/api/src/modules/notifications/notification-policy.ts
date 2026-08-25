import type { NotificationType, RealtimeEventType } from '@rentacar/shared';
import type { RentalEventPayload, RentalEventType } from '../rentals/rental-events.types';
import type { AgreementEventPayload, AgreementEventType } from '../agreements/agreement-events.types';
import type { HandoverEventPayload, HandoverEventType } from '../handovers/handover-events.types';

export type NotificationDispatch = {
  recipientIds: string[];
  persistType: NotificationType | null;
  realtimeType: RealtimeEventType;
  rentalId?: string;
  agreementId?: string;
  handoverId?: string;
};

function uniqueWithoutActor(ids: string[], actorId?: string): string[] {
  return [...new Set(ids.filter((id) => id && id !== actorId))];
}

export function planRentalNotification(
  event: RentalEventType,
  payload: RentalEventPayload,
): NotificationDispatch {
  const both = [payload.ownerId, payload.renterId];
  const actorId = payload.actorId ?? payload.completedById;
  const base = {
    rentalId: payload.rentalId,
    recipientIds: uniqueWithoutActor(both, actorId),
  };

  switch (event) {
    case 'RENTAL_CREATED':
      return {
        ...base,
        recipientIds: uniqueWithoutActor([payload.ownerId], payload.renterId),
        persistType: 'RENTAL_CREATED',
        realtimeType: 'RENTAL_CREATED',
      };
    case 'RENTAL_ACCEPTED':
      return {
        ...base,
        recipientIds: uniqueWithoutActor([payload.renterId], payload.ownerId),
        persistType: 'RENTAL_ACCEPTED',
        realtimeType: 'RENTAL_ACCEPTED',
      };
    case 'RENTAL_REJECTED':
      return {
        ...base,
        recipientIds: uniqueWithoutActor([payload.renterId], payload.ownerId),
        persistType: 'RENTAL_REJECTED',
        realtimeType: 'RENTAL_REJECTED',
      };
    case 'RENTAL_CANCELLED':
      return { ...base, persistType: 'RENTAL_CANCELLED', realtimeType: 'RENTAL_CANCELLED' };
    case 'RENTAL_COMPLETED':
      return { ...base, persistType: 'RENTAL_COMPLETED', realtimeType: 'RENTAL_COMPLETED' };
    default:
      return { ...base, persistType: null, realtimeType: 'STATE_SYNC' };
  }
}

export function planAgreementNotification(
  event: AgreementEventType,
  payload: AgreementEventPayload,
): NotificationDispatch {
  const both = [payload.ownerId, payload.renterId];
  const base = {
    rentalId: payload.rentalId,
    agreementId: payload.agreementId,
    recipientIds: uniqueWithoutActor(both),
  };

  switch (event) {
    case 'AGREEMENT_CREATED':
      return {
        ...base,
        recipientIds: uniqueWithoutActor([payload.renterId], payload.ownerId),
        persistType: 'AGREEMENT_CREATED',
        realtimeType: 'AGREEMENT_CREATED',
      };
    case 'AGREEMENT_OWNER_APPROVED':
      return {
        ...base,
        recipientIds: uniqueWithoutActor([payload.renterId], payload.ownerId),
        persistType: null,
        realtimeType: 'STATE_SYNC',
      };
    case 'AGREEMENT_RENTER_APPROVED':
      return {
        ...base,
        recipientIds: uniqueWithoutActor([payload.ownerId], payload.renterId),
        persistType: null,
        realtimeType: 'STATE_SYNC',
      };
    case 'AGREEMENT_FULLY_APPROVED':
      return {
        ...base,
        persistType: 'AGREEMENT_FULLY_APPROVED',
        realtimeType: 'AGREEMENT_FULLY_APPROVED',
      };
    case 'AGREEMENT_CANCELLED':
      return {
        ...base,
        persistType: 'AGREEMENT_CANCELLED',
        realtimeType: 'AGREEMENT_CANCELLED',
      };
    default:
      return { ...base, persistType: null, realtimeType: 'STATE_SYNC' };
  }
}

export function planHandoverNotification(
  event: HandoverEventType,
  payload: HandoverEventPayload,
): NotificationDispatch {
  const both = [payload.ownerId, payload.renterId];
  const base = {
    rentalId: payload.rentalId,
    handoverId: payload.handoverId,
    recipientIds: uniqueWithoutActor(both),
  };

  switch (event) {
    case 'HANDOVER_SUBMITTED':
      return {
        ...base,
        recipientIds: uniqueWithoutActor([payload.renterId], payload.ownerId),
        persistType: 'HANDOVER_PHOTOS_READY',
        realtimeType: 'HANDOVER_PHOTOS_READY',
      };
    case 'HANDOVER_RENTER_APPROVED':
      return {
        ...base,
        recipientIds: uniqueWithoutActor([payload.ownerId], payload.renterId),
        persistType: 'HANDOVER_APPROVED',
        realtimeType: 'HANDOVER_APPROVED',
      };
    case 'RENTAL_BECAME_ACTIVE':
      return {
        ...base,
        persistType: null,
        realtimeType: 'RENTAL_BECAME_ACTIVE',
      };
    case 'HANDOVER_CREATED':
    case 'HANDOVER_PHOTO_UPLOADED':
    case 'HANDOVER_PHOTO_REMOVED':
    case 'HANDOVER_COMPLETED':
      return { ...base, persistType: null, realtimeType: 'STATE_SYNC' };
    default:
      return { ...base, persistType: null, realtimeType: 'STATE_SYNC' };
  }
}
