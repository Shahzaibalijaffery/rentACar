import { HandoverStatus } from '@prisma/client';

/** Minimum photos required before owner can submit pickup evidence. */
export const MIN_PICKUP_HANDOVER_PHOTOS = 3;

/** Absolute fallback only. Per-plan caps live in @rentacar/shared USER_PLAN_LIMITS. */
export const MAX_PICKUP_HANDOVER_PHOTOS = 25;

export const HANDOVER_TRANSITIONS: Record<HandoverStatus, HandoverStatus[]> = {
  [HandoverStatus.OWNER_PHOTOS_REQUIRED]: [HandoverStatus.RENTER_APPROVAL_REQUIRED],
  [HandoverStatus.RENTER_APPROVAL_REQUIRED]: [HandoverStatus.APPROVED],
  [HandoverStatus.APPROVED]: [],
  [HandoverStatus.CANCELLED]: [],
};

export function canTransitionHandover(from: HandoverStatus, to: HandoverStatus): boolean {
  return HANDOVER_TRANSITIONS[from]?.includes(to) ?? false;
}
