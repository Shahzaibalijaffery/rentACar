import type { RealtimeEvent } from '@rentacar/shared';
import { agreementKeys } from '@/api/keys/agreement.keys';
import { handoverKeys } from '@/api/keys/handover.keys';
import { notificationKeys } from '@/api/keys/notification.keys';
import { rentalKeys } from '@/api/keys/rental.keys';
import { queryClient } from '@/api/query-client';

export function applyRealtimeEvent(event: RealtimeEvent): void {
  void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
  void queryClient.invalidateQueries({ queryKey: agreementKeys.all });
  void queryClient.invalidateQueries({ queryKey: handoverKeys.all });
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all });

  if (event.rentalId) {
    void queryClient.invalidateQueries({ queryKey: rentalKeys.detail(event.rentalId) });
    void queryClient.invalidateQueries({ queryKey: agreementKeys.byRental(event.rentalId) });
    void queryClient.invalidateQueries({ queryKey: handoverKeys.pickupByRental(event.rentalId) });
  }
}
