jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue({ service: 'rentacar.session', storage: 'KeystoreAESGCM_NoAuth' }),
  getGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(undefined),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  },
  SECURITY_LEVEL: { ANY: 0 },
  STORAGE_TYPE: { AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth' },
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  createNavigationContainerRef: jest.fn(),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  })),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    requestPermission: jest.fn().mockResolvedValue(1),
    getToken: jest.fn().mockResolvedValue('token'),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onMessage: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn().mockResolvedValue(null),
  }),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn((success) =>
    success({
      coords: { latitude: 24.86, longitude: 67.0 },
    }),
  ),
  requestAuthorization: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const Icon = () => null;
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});

jest.mock('@/api/hooks/use-auth', () => ({
  restoreSessionFromStorage: jest.fn().mockResolvedValue(false),
  useProfileQuery: jest.fn(() => ({ isLoading: false, isError: false, data: null })),
  useLogoutMutation: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));

require('./src/i18n');
