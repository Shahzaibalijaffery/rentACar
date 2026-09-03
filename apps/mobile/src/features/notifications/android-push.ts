import { PermissionsAndroid, Platform } from 'react-native';
import { registerDeviceToken, unregisterDeviceToken } from '@/api/hooks/use-notifications';
import { applyRealtimeEvent } from '@/features/notifications/apply-realtime-event';
import { presentIncomingNotification } from '@/features/notifications/notification-toast-store';
import {
  resolveMessagingApi,
  type MessagingApi,
} from '@/features/notifications/resolve-messaging-api';
import { getCurrentLocale, i18n } from '@/i18n';
import type { RealtimeEvent } from '@rentacar/shared';
import { isNotificationType } from '@rentacar/shared';

let registeredToken: string | null = null;
let unsubscribeFns: Array<() => void> = [];

function loadMessagingApi(): MessagingApi | null {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    // Native module is optional until google-services.json is added.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@react-native-firebase/app');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('@react-native-firebase/messaging');
    const api = resolveMessagingApi(loaded);
    if (!api) {
      console.warn('[push] Firebase Messaging modular API was not found');
    }
    return api;
  } catch (error) {
    console.warn('[push] Firebase Messaging is not available', error);
    return null;
  }
}

function eventFromData(data?: Record<string, string>): RealtimeEvent {
  const type = data?.type && isNotificationType(data.type) ? data.type : 'STATE_SYNC';
  return {
    type,
    rentalId: data?.rentalId || undefined,
    agreementId: data?.agreementId || undefined,
    handoverId: data?.handoverId || undefined,
  };
}

export function registerAndroidBackgroundHandler(): void {
  try {
    const api = loadMessagingApi();
    if (!api) {
      return;
    }

    api.setBackgroundMessageHandler(api.getMessaging(), async (remoteMessage) => {
      applyRealtimeEvent(eventFromData(remoteMessage.data));
    });
  } catch (error) {
    console.warn('[push] Failed to register FCM background handler', error);
  }
}

async function ensureAndroidNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Number(Platform.Version) < 33) {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  if (!permission) {
    return false;
  }

  try {
    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) {
      return true;
    }

    const result = await PermissionsAndroid.request(permission, {
      title: i18n.t('notifications:permissionTitle'),
      message: i18n.t('notifications:permissionBody'),
      buttonPositive: i18n.t('notifications:permissionAllow'),
      buttonNegative: i18n.t('notifications:permissionNotNow'),
    });

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function startAndroidPush(): Promise<void> {
  unsubscribeFns.forEach((fn) => fn());
  unsubscribeFns = [];

  const permissionGranted = await ensureAndroidNotificationPermission();
  if (!permissionGranted) {
    console.warn('[push] Notification permission was not granted');
  }

  const api = loadMessagingApi();
  if (!api) {
    return;
  }

  try {
    const messaging = api.getMessaging();
    await api.requestPermission(messaging).catch(() => undefined);
    if (typeof api.registerDeviceForRemoteMessages === 'function') {
      await api.registerDeviceForRemoteMessages(messaging);
    }

    const token = await api.getToken(messaging);
    if (!token) {
      console.warn('[push] FCM token was empty');
      return;
    }

    registeredToken = token;
    await registerDeviceToken({
      token,
      platform: 'ANDROID',
      locale: getCurrentLocale(),
    });
    console.log('[push] Android FCM token registered');

    unsubscribeFns.push(
      api.onTokenRefresh(messaging, (nextToken) => {
        registeredToken = nextToken;
        void registerDeviceToken({
          token: nextToken,
          platform: 'ANDROID',
          locale: getCurrentLocale(),
        });
      }),
    );

    unsubscribeFns.push(
      api.onMessage(messaging, (remoteMessage) => {
        const event = eventFromData(remoteMessage.data);
        applyRealtimeEvent(event);
        presentIncomingNotification(event);
      }),
    );

    unsubscribeFns.push(
      api.onNotificationOpenedApp(messaging, (remoteMessage) => {
        applyRealtimeEvent(eventFromData(remoteMessage.data));
      }),
    );

    const initial = await api.getInitialNotification(messaging);
    if (initial?.data) {
      applyRealtimeEvent(eventFromData(initial.data));
    }
  } catch (error) {
    console.warn('[push] Failed to register Android FCM', error);
  }
}

export async function stopAndroidPush(): Promise<void> {
  unsubscribeFns.forEach((fn) => fn());
  unsubscribeFns = [];
  if (registeredToken) {
    try {
      await unregisterDeviceToken(registeredToken);
    } catch {
      // Logout should still succeed if the token is already gone.
    }
    registeredToken = null;
  }
}
