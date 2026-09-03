import type { NotificationType } from '@rentacar/shared';
import type { AppStackParamList } from '@/navigation/types';

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

export type NotificationNavItem = {
  type: NotificationType;
  rentalId?: string | null;
  agreementId?: string | null;
  handoverId?: string | null;
};

export type NotificationNavTarget =
  | { screen: 'AgreementDetail'; params: AppStackParamList['AgreementDetail'] }
  | { screen: 'PickupHandover'; params: AppStackParamList['PickupHandover'] }
  | { screen: 'RentalRequestDetail'; params: AppStackParamList['RentalRequestDetail'] }
  | { screen: 'Notifications'; params: undefined };

export function targetForNotification(
  item: NotificationNavItem,
  fallbackPerspective: 'owner' | 'renter',
): NotificationNavTarget {
  if (!item.rentalId) {
    return { screen: 'Notifications', params: undefined };
  }

  const perspective = perspectiveForNotification(item.type, fallbackPerspective);

  if (
    item.agreementId &&
    (item.type === 'AGREEMENT_CREATED' ||
      item.type === 'AGREEMENT_APPROVAL_NEEDED' ||
      item.type === 'AGREEMENT_FULLY_APPROVED' ||
      item.type === 'AGREEMENT_CANCELLED')
  ) {
    return {
      screen: 'AgreementDetail',
      params: {
        agreementId: item.agreementId,
        rentalId: item.rentalId,
        perspective,
      },
    };
  }

  if (
    item.handoverId &&
    (item.type === 'HANDOVER_PHOTOS_READY' || item.type === 'HANDOVER_APPROVED')
  ) {
    return {
      screen: 'PickupHandover',
      params: {
        handoverId: item.handoverId,
        rentalId: item.rentalId,
        perspective,
      },
    };
  }

  return {
    screen: 'RentalRequestDetail',
    params: {
      rentalId: item.rentalId,
      perspective,
    },
  };
}
