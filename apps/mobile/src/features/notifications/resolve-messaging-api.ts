export type MessagingInstance = {
  requestPermission?: () => Promise<number>;
  registerDeviceForRemoteMessages?: () => Promise<void>;
  getToken?: () => Promise<string>;
};

export type MessagingApi = {
  getMessaging: () => MessagingInstance;
  getToken: (messaging: MessagingInstance) => Promise<string>;
  requestPermission: (messaging: MessagingInstance) => Promise<number>;
  registerDeviceForRemoteMessages?: (messaging: MessagingInstance) => Promise<void>;
  onTokenRefresh: (messaging: MessagingInstance, handler: (token: string) => void) => () => void;
  onMessage: (
    messaging: MessagingInstance,
    handler: (message: { data?: Record<string, string> }) => void,
  ) => () => void;
  setBackgroundMessageHandler: (
    messaging: MessagingInstance,
    handler: (message: { data?: Record<string, string> }) => Promise<void>,
  ) => void;
  onNotificationOpenedApp: (
    messaging: MessagingInstance,
    handler: (message: { data?: Record<string, string> }) => void,
  ) => () => void;
  getInitialNotification: (
    messaging: MessagingInstance,
  ) => Promise<{ data?: Record<string, string> } | null>;
};

/**
 * RN Firebase v22+ is modular (`getMessaging`). Older namespaced builds
 * exported `default()` as a factory. Metro may also wrap ESM as `{ default: mod }`.
 */
export function resolveMessagingApi(loaded: unknown): MessagingApi | null {
  if (!loaded || typeof loaded !== 'object') {
    return null;
  }

  const record = loaded as MessagingApi & { default?: unknown };
  if (typeof record.getMessaging === 'function') {
    return record;
  }

  const nested = record.default;
  if (nested && typeof nested === 'object' && typeof (nested as MessagingApi).getMessaging === 'function') {
    return nested as MessagingApi;
  }

  return null;
}
