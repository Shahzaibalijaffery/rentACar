import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

const SESSION_SERVICE = 'rentacar.session';
const LEGACY_REFRESH_SERVICE = 'rentacar.refresh-token';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
};

function sessionOptions(): Keychain.SetOptions {
  return {
    service: SESSION_SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    ...(Platform.OS === 'android'
      ? {
          securityLevel: Keychain.SECURITY_LEVEL.ANY,
          storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
        }
      : {}),
  };
}

export async function saveSession(session: StoredSession): Promise<void> {
  await Keychain.setGenericPassword('session', JSON.stringify(session), sessionOptions());
}

export async function getStoredSession(): Promise<StoredSession | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: SESSION_SERVICE });
    if (credentials) {
      const parsed: unknown = JSON.parse(credentials.password);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'accessToken' in parsed &&
        'refreshToken' in parsed &&
        typeof parsed.accessToken === 'string' &&
        typeof parsed.refreshToken === 'string' &&
        parsed.refreshToken.length > 0
      ) {
        return {
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
        };
      }
    }

    const legacy = await Keychain.getGenericPassword({ service: LEGACY_REFRESH_SERVICE });
    if (legacy && typeof legacy !== 'boolean' && legacy.password) {
      return { accessToken: '', refreshToken: legacy.password };
    }

    return null;
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  const session = await getStoredSession();
  return session?.refreshToken ?? null;
}

export async function clearRefreshToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
  } catch {
    // Ignore missing entries.
  }
  try {
    await Keychain.resetGenericPassword({ service: LEGACY_REFRESH_SERVICE });
  } catch {
    // Ignore missing entries.
  }
}
