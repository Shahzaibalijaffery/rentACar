import { create } from 'zustand';
import type { NotificationType, RealtimeEvent } from '@rentacar/shared';
import { isNotificationType } from '@rentacar/shared';

export type IncomingNotificationAlert = {
  id: string;
  type: NotificationType;
  rentalId?: string;
  agreementId?: string;
  handoverId?: string;
  notificationId?: string;
};

type NotificationToastState = {
  alert: IncomingNotificationAlert | null;
  show: (event: RealtimeEvent) => void;
  dismiss: () => void;
};

let lastDedupeKey = '';
let lastShownAt = 0;
const DEDUPE_MS = 2500;

function dedupeKey(event: RealtimeEvent): string {
  return event.notification?.id ?? `${event.type}:${event.rentalId ?? ''}:${event.handoverId ?? ''}`;
}

export const useNotificationToastStore = create<NotificationToastState>((set) => ({
  alert: null,
  show: (event) => {
    if (!isNotificationType(event.type)) {
      return;
    }

    const key = dedupeKey(event);
    const now = Date.now();
    if (key === lastDedupeKey && now - lastShownAt < DEDUPE_MS) {
      return;
    }
    lastDedupeKey = key;
    lastShownAt = now;

    set({
      alert: {
        id: `${key}:${now}`,
        type: event.type,
        rentalId: event.rentalId,
        agreementId: event.agreementId,
        handoverId: event.handoverId,
        notificationId: event.notification?.id,
      },
    });
  },
  dismiss: () => set({ alert: null }),
}));

export function presentIncomingNotification(event: RealtimeEvent): void {
  useNotificationToastStore.getState().show(event);
}

export function resetNotificationToastDedupe(): void {
  lastDedupeKey = '';
  lastShownAt = 0;
  useNotificationToastStore.getState().dismiss();
}
