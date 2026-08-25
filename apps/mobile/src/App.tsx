import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, StatusBar, StyleSheet, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { queryClient } from '@/api/query-client';
import { bootstrapI18n, i18n } from '@/i18n';
import { RootNavigator } from '@/navigation/root-navigator';
import { colors } from '@/theme';

export function App() {
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    void bootstrapI18n().finally(() => setLocaleReady(true));
  }, []);

  if (!localeReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.navigator, I18nManager.isRTL ? styles.rtl : null]}>
              <RootNavigator />
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  navigator: {
    flex: 1,
  },
  rtl: {
    direction: 'rtl' as const,
  },
});
