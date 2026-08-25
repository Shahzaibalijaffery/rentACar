import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { restoreSessionFromStorage } from '@/api/hooks/use-auth';
import { startAndroidPush } from '@/features/notifications/android-push';
import { useRealtimeConnection } from '@/features/notifications/use-realtime-connection';
import { AppNavigator } from '@/navigation/app-navigator';
import { AuthNavigator } from '@/navigation/auth-navigator';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/auth-store';
import { colors } from '@/theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useRealtimeConnection(accessToken);

  useEffect(() => {
    void restoreSessionFromStorage();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void startAndroidPush();
  }, [accessToken]);

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer key={accessToken ? 'app' : 'auth'}>
      <RootStack.Navigator screenOptions={{ headerShown: false, statusBarStyle: 'dark' }}>
        {accessToken ? (
          <RootStack.Screen name="App" component={AppNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
