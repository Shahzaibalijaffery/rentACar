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

jest.mock('@/api/hooks/use-auth', () => ({
  restoreSessionFromStorage: jest.fn().mockResolvedValue(false),
  useProfileQuery: jest.fn(() => ({ isLoading: false, isError: false, data: null })),
  useLogoutMutation: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));
