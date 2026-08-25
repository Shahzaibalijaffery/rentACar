module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-keychain|react-native-screens|react-native-safe-area-context|i18next|react-i18next|lucide-react-native)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
