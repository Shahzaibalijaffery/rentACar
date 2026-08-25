import { Platform } from 'react-native';

type EnvConfig = {
  apiBaseUrl: string;
  wsBaseUrl: string;
};

const PRODUCTION_API_ORIGIN = 'https://rentacar-nidp.onrender.com';
const PRODUCTION_API_BASE_URL = `${PRODUCTION_API_ORIGIN}/api/v1`;

/**
 * Android emulator reaches the host machine via 10.0.2.2 (not localhost).
 */
const LOCAL_API_ORIGIN = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const LOCAL_API_BASE_URL = `${LOCAL_API_ORIGIN}/api/v1`;

export const env: EnvConfig = {
  apiBaseUrl: __DEV__ ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL,
  wsBaseUrl: __DEV__ ? LOCAL_API_ORIGIN : PRODUCTION_API_ORIGIN,
};
