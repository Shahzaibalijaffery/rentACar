import { Platform } from 'react-native';

type EnvConfig = {
  apiBaseUrl: string;
};

/**
 * Android emulator reaches the host machine via 10.0.2.2 (not localhost).
 */
const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/v1' : 'http://localhost:3000/api/v1';

export const env: EnvConfig = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  // Physical device on same Wi‑Fi (replace with your Mac's LAN IP):
  // apiBaseUrl: 'http://192.168.18.78:3000/api/v1',
};
