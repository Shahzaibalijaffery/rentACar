import type { NotificationType } from '@rentacar/shared';

export function perspectiveForNotification(
  type: NotificationType,
  fallback: 'owner' | 'renter',
): 'owner' | 'renter' {
  switch (type) {
    case 'RENTAL_CREATED':
    case 'HANDOVER_APPROVED':
      return 'owner';
    case 'RENTAL_ACCEPTED':
    case 'RENTAL_REJECTED':
    case 'AGREEMENT_CREATED':
    case 'AGREEMENT_APPROVAL_NEEDED':
    case 'HANDOVER_PHOTOS_READY':
      return 'renter';
    default:
      return fallback;
  }
}
