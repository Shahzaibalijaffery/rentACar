import { PermissionsAndroid, Platform } from 'react-native';
import { registerDeviceToken, unregisterDeviceToken } from '@/api/hooks/use-notifications';
import { applyRealtimeEvent } from '@/features/notifications/apply-realtime-event';
import { getCurrentLocale } from '@/i18n';
import type { RealtimeEvent } from '@rentacar/shared';
import { isNotificationType } from '@rentacar/shared';

type MessagingModule = {
  default: () => {
    requestPermission: () => Promise<number>;
    getToken: () => Promise<string>;
    onTokenRefresh: (handler: (token: string) => void) => () => void;
    onMessage: (handler: (message: { data?: Record<string, string> }) => void) => () => void;
    setBackgroundMessageHandler: (
      handler: (message: { data?: Record<string, string> }) => Promise<void>,
    ) => void;
    onNotificationOpenedApp: (
      handler: (message: { data?: Record<string, string> }) => void,
    ) => () => void;
    getInitialNotification: () => Promise<{ data?: Record<string, string> } | null>;
  };
  AuthorizationStatus: { AUTHORIZED: number; PROVISIONAL: number };
};

let registeredToken: string | null = null;
let unsubscribeFns: Array<() => void> = [];

function loadMessaging(): MessagingModule | null {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    // Native module is optional until google-services.json is added.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('@react-native-firebase/messaging') as MessagingModule & {
      default?: MessagingModule['default'];
    };
    if (typeof loaded.default !== 'function') {
      return null;
    }
    return loaded;
  } catch {
    return null;
  }
}

export function registerAndroidBackgroundHandler(): void {
  try {
    const messagingModule = loadMessaging();
    if (!messagingModule) {
      return;
    }

    messagingModule.default().setBackgroundMessageHandler(async (remoteMessage) => {
      applyRealtimeEvent(eventFromData(remoteMessage.data));
    });
  } catch {
    // Native Firebase is optional until google-services.json is added.
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

async function requestAndroidNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) {
    return;
  }

  try {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  } catch {
    // Permission prompt is best-effort; token registration can still fail later.
  }
}

export async function startAndroidPush(): Promise<void> {
  unsubscribeFns.forEach((fn) => fn());
  unsubscribeFns = [];

  const messagingModule = loadMessaging();
  if (!messagingModule) {
    return;
  }

  try {
    await requestAndroidNotificationPermission();

    const messaging = messagingModule.default();
    const authStatus = await messaging.requestPermission();
    const statuses = messagingModule.AuthorizationStatus;
    const allowed =
      !statuses ||
      authStatus === statuses.AUTHORIZED ||
      authStatus === statuses.PROVISIONAL;
    if (!allowed) {
      return;
    }

    const token = await messaging.getToken();
    if (token) {
      registeredToken = token;
      await registerDeviceToken({
        token,
        platform: 'ANDROID',
        locale: getCurrentLocale(),
      });
    }

    unsubscribeFns.push(
      messaging.onTokenRefresh((nextToken) => {
        registeredToken = nextToken;
        void registerDeviceToken({
          token: nextToken,
          platform: 'ANDROID',
          locale: getCurrentLocale(),
        });
      }),
    );

    unsubscribeFns.push(
      messaging.onMessage((remoteMessage) => {
        applyRealtimeEvent(eventFromData(remoteMessage.data));
      }),
    );

    unsubscribeFns.push(
      messaging.onNotificationOpenedApp((remoteMessage) => {
        applyRealtimeEvent(eventFromData(remoteMessage.data));
      }),
    );

    const initial = await messaging.getInitialNotification();
    if (initial?.data) {
      applyRealtimeEvent(eventFromData(initial.data));
    }
  } catch {
    // Firebase is optional until google-services.json is added.
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
