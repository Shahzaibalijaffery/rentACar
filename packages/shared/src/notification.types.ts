export const NOTIFICATION_TYPES = [
  'RENTAL_CREATED',
  'RENTAL_ACCEPTED',
  'RENTAL_REJECTED',
  'RENTAL_CANCELLED',
  'RENTAL_COMPLETED',
  'AGREEMENT_CREATED',
  'AGREEMENT_APPROVAL_NEEDED',
  'AGREEMENT_FULLY_APPROVED',
  'AGREEMENT_CANCELLED',
  'HANDOVER_PHOTOS_READY',
  'HANDOVER_APPROVED',
  'RENTAL_BECAME_ACTIVE',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export type NotificationView = {
  id: string;
  type: NotificationType;
  rentalId: string | null;
  agreementId: string | null;
  handoverId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationUnreadCount = {
  count: number;
};

export type RealtimeEventType = NotificationType | 'STATE_SYNC';

export type RealtimeEvent = {
  type: RealtimeEventType;
  rentalId?: string;
  agreementId?: string;
  handoverId?: string;
  notification?: NotificationView;
};

export type DevicePlatform = 'ANDROID';

export type RegisterDeviceTokenRequest = {
  token: string;
  platform: DevicePlatform;
  locale?: 'en' | 'ur';
};
