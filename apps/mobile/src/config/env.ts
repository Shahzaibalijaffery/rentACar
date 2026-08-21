import { Platform } from 'react-native';

type EnvConfig = {
  apiBaseUrl: string;
};

const PRODUCTION_API_BASE_URL = 'https://rentacar-nidp.onrender.com/api/v1';

/**
 * Android emulator reaches the host machine via 10.0.2.2 (not localhost).
 */
const LOCAL_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/v1' : 'http://localhost:3000/api/v1';

export const env: EnvConfig = {
  apiBaseUrl: __DEV__ ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL,
};
