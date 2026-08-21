import { HandoverStatus } from '@prisma/client';

/** Minimum photos required before owner can submit pickup evidence. */
export const MIN_PICKUP_HANDOVER_PHOTOS = 3;

/** Maximum draft photos owner can attach before submission. */
export const MAX_PICKUP_HANDOVER_PHOTOS = 12;

export const HANDOVER_TRANSITIONS: Record<HandoverStatus, HandoverStatus[]> = {
  [HandoverStatus.OWNER_PHOTOS_REQUIRED]: [HandoverStatus.RENTER_APPROVAL_REQUIRED],
  [HandoverStatus.RENTER_APPROVAL_REQUIRED]: [HandoverStatus.APPROVED],
  [HandoverStatus.APPROVED]: [],
  [HandoverStatus.CANCELLED]: [],
};

export function canTransitionHandover(from: HandoverStatus, to: HandoverStatus): boolean {
  return HANDOVER_TRANSITIONS[from]?.includes(to) ?? false;
}
