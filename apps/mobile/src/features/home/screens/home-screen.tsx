import { useLayoutEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionTile } from '@/components/action-tile';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppModeSwitcher } from '@/components/app-mode-switcher';
import { AppText } from '@/components/app-text';
import { PlanBadge } from '@/components/plan-badge';
import { QueryState } from '@/components/query-state';
import { ScreenLayout } from '@/components/screen-layout';
import { NotificationBellButton } from '@/features/notifications/components/notification-bell-button';
import { useTranslation } from 'react-i18next';
import { useLogoutMutation, useProfileQuery } from '@/api/hooks/use-auth';
import type { AppStackParamList } from '@/navigation/types';
import { useAppModeStore } from '@/stores/app-mode-store';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation('home');
  const profileQuery = useProfileQuery();
  const logoutMutation = useLogoutMutation();
  const activeMode = useAppModeStore((state) => state.activeMode);
  const isOwnerMode = activeMode === 'owner';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isOwnerMode ? t('ownerHub') : t('renterHub'),
      headerRight: () => <NotificationBellButton />,
    });
  }, [navigation, isOwnerMode, t]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onError: (error) => {
        Alert.alert(t('logoutFailed'), error.message);
      },
    });
  };

  return (
    <ScreenLayout>
      <QueryState
        isLoading={profileQuery.isLoading}
        isError={profileQuery.isError}
        errorMessage={profileQuery.error?.message}
      >
        <AppCard style={styles.hero}>
          <AppText variant="caption" style={styles.heroEyebrow}>
            {isOwnerMode ? t('ownerProfile') : t('renterProfile')}
          </AppText>
          <AppText variant="title" style={styles.heroTitle}>
            {t('hello', { name: profileQuery.data?.fullName ?? t('helloFallback') })}
          </AppText>
          {profileQuery.data ? <PlanBadge plan={profileQuery.data.plan} /> : null}
          <AppText variant="body" style={styles.heroSubtitle}>
            {isOwnerMode ? t('ownerSubtitle') : t('renterSubtitle')}
          </AppText>
        </AppCard>
      </QueryState>

      <AppModeSwitcher />

      <View style={styles.section}>
        <AppText variant="label" style={styles.sectionLabel}>
          {t('quickActions')}
        </AppText>
        {isOwnerMode ? (
          <>
            <ActionTile
              title={t('myVehicles')}
              description={t('myVehiclesHint')}
              icon="car"
              accent={colors.primary}
              onPress={() => navigation.navigate('MyVehicles')}
            />
            <ActionTile
              title={t('addVehicle')}
              description={t('addVehicleHint')}
              icon="plus"
              accent={colors.accent}
              onPress={() => navigation.navigate('AddVehicle')}
            />
          </>
        ) : (
          <>
            <ActionTile
              title={t('discover')}
              description={t('discoverHint')}
              icon="compass"
              accent={colors.primary}
              onPress={() => navigation.navigate('Discovery')}
            />
            <ActionTile
              title={t('searchCnic')}
              description={t('searchCnicHint')}
              icon="id"
              accent={colors.accent}
              onPress={() => navigation.navigate('ProfileSearch')}
            />
          </>
        )}
        <ActionTile
          title={t('rentals')}
          description={t('rentalsHint')}
          icon="calendar"
          onPress={() => navigation.navigate('Rentals')}
        />
        <ActionTile
          title={t('notifications')}
          description={t('notificationsHint')}
          icon="bell"
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="label" style={styles.sectionLabel}>
          {t('account')}
        </AppText>
        <ActionTile
          title={t('myProfile')}
          description={t('myProfileHint')}
          icon="user"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      <AppButton
        title={t('logOut')}
        icon="logout"
        variant="ghost"
        loading={logoutMutation.isPending}
        onPress={handleLogout}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  heroTitle: {
    color: colors.text,
  },
  heroEyebrow: {
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroSubtitle: {
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
