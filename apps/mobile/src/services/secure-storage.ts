import * as Keychain from 'react-native-keychain';

const REFRESH_TOKEN_SERVICE = 'rentacar.refresh-token';

export async function saveRefreshToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('refresh-token', token, {
    service: REFRESH_TOKEN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getRefreshToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_SERVICE });
  if (!credentials) {
    return null;
  }
  return credentials.password;
}

export async function clearRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE });
}
