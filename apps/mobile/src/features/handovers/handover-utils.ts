import type { HandoverStatus } from '@rentacar/shared';
import { i18n } from '@/i18n';

export function getHandoverStatusLabel(status: HandoverStatus): string {
  return i18n.t(`handovers:status.${status}`, { defaultValue: status });
}

export const MIN_PICKUP_HANDOVER_PHOTOS = 3;
