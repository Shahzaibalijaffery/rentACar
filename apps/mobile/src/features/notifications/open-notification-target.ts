import type { NotificationNavTarget } from '@/features/notifications/notification-navigation';
import { navigateInApp } from '@/navigation/navigation-ref';

export function openNotificationTarget(target: NotificationNavTarget): void {
  switch (target.screen) {
    case 'Notifications':
      navigateInApp('Notifications');
      return;
    case 'AgreementDetail':
      navigateInApp('AgreementDetail', target.params);
      return;
    case 'PickupHandover':
      navigateInApp('PickupHandover', target.params);
      return;
    case 'RentalRequestDetail':
      navigateInApp('RentalRequestDetail', target.params);
      return;
  }
}
