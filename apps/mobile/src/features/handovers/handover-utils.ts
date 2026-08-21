import type { HandoverStatus } from '@rentacar/shared';

export function getHandoverStatusLabel(status: HandoverStatus): string {
  switch (status) {
    case 'OWNER_PHOTOS_REQUIRED':
      return 'Owner photos required';
    case 'RENTER_APPROVAL_REQUIRED':
      return 'Awaiting renter approval';
    case 'APPROVED':
      return 'Approved';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export const MIN_PICKUP_HANDOVER_PHOTOS = 3;
