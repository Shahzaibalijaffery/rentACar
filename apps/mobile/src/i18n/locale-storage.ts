import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { isLocale, type Locale } from '@/i18n/locale.types';

const LOCALE_SERVICE = 'rentacar.locale';

function setOptions(): Keychain.SetOptions {
  return {
    service: LOCALE_SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    ...(Platform.OS === 'android'
      ? {
          securityLevel: Keychain.SECURITY_LEVEL.ANY,
          storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
        }
      : {}),
  };
}

export async function loadSavedLocale(): Promise<Locale | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: LOCALE_SERVICE });
    if (credentials && typeof credentials !== 'boolean' && isLocale(credentials.password)) {
      return credentials.password;
    }
  } catch {
    return null;
  }
  return null;
}

export async function saveLocale(locale: Locale): Promise<void> {
  await Keychain.setGenericPassword('locale', locale, setOptions());
}
