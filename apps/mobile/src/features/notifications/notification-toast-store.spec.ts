import type { RealtimeEvent } from '@rentacar/shared';
import {
  presentIncomingNotification,
  resetNotificationToastDedupe,
  useNotificationToastStore,
} from './notification-toast-store';

describe('notification toast store', () => {
  beforeEach(() => {
    resetNotificationToastDedupe();
  });

  it('ignores STATE_SYNC events', () => {
    presentIncomingNotification({ type: 'STATE_SYNC' });
    expect(useNotificationToastStore.getState().alert).toBeNull();
  });

  it('shows a rental notification', () => {
    presentIncomingNotification({
      type: 'RENTAL_CREATED',
      rentalId: 'r1',
      notification: {
        id: 'n1',
        type: 'RENTAL_CREATED',
        rentalId: 'r1',
        agreementId: null,
        handoverId: null,
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    });

    expect(useNotificationToastStore.getState().alert?.type).toBe('RENTAL_CREATED');
    expect(useNotificationToastStore.getState().alert?.rentalId).toBe('r1');
  });

  it('dedupes the same notification from socket and FCM', () => {
    const event: RealtimeEvent = {
      type: 'RENTAL_ACCEPTED',
      rentalId: 'r2',
      notification: {
        id: 'n2',
        type: 'RENTAL_ACCEPTED',
        rentalId: 'r2',
        agreementId: null,
        handoverId: null,
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    };

    presentIncomingNotification(event);
    presentIncomingNotification(event);
    expect(useNotificationToastStore.getState().alert?.notificationId).toBe('n2');
  });
});
