import { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionTile } from '@/components/action-tile';
import { AppButton } from '@/components/app-button';
import { AppIcon } from '@/components/app-icon';
import { AppModeSwitcher } from '@/components/app-mode-switcher';
import { AppText } from '@/components/app-text';
import { PlanBadge } from '@/components/plan-badge';
import { QueryState } from '@/components/query-state';
import { ScreenLayout } from '@/components/screen-layout';
import { NotificationBellButton } from '@/features/notifications/components/notification-bell-button';
import { useTranslation } from 'react-i18next';
import { useLogoutMutation, useProfileQuery } from '@/api/hooks/use-auth';
import type { AppStackParamList } from '@/navigation/types';
import { colors, radii, spacing, useAppModeTheme } from '@/theme';
import { showAppAlert } from '@/stores/app-alert-store';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation('home');
  const profileQuery = useProfileQuery();
  const logoutMutation = useLogoutMutation();
  const theme = useAppModeTheme();
  const isOwnerMode = theme.mode === 'owner';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isOwnerMode ? t('ownerHub') : t('renterHub'),
      headerTintColor: theme.headerTint,
      headerRight: () => <NotificationBellButton color={theme.headerTint} />,
    });
  }, [navigation, isOwnerMode, t, theme.headerTint]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onError: (error) => {
        showAppAlert(t('logoutFailed'), error.message);
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
        <View style={[styles.hero, { backgroundColor: theme.heroBg }]}>
          {isOwnerMode ? <View style={styles.ownerStripe} /> : null}
          <View style={[styles.roleBadge, { backgroundColor: theme.heroBadgeBg }]}>
            <AppIcon name={theme.icon} size={16} color={theme.heroText} />
            <AppText variant="label" style={{ color: theme.heroText }}>
              {isOwnerMode ? t('ownerProfile') : t('renterProfile')}
            </AppText>
          </View>
          <AppText variant="title" style={{ color: theme.heroText }}>
            {t('hello', { name: profileQuery.data?.fullName ?? t('helloFallback') })}
          </AppText>
          {profileQuery.data ? <PlanBadge plan={profileQuery.data.plan} onPrimary /> : null}
          <AppText variant="body" style={{ color: theme.heroMuted }}>
            {isOwnerMode ? t('ownerSubtitle') : t('renterSubtitle')}
          </AppText>
        </View>
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
              accent={theme.accent}
              iconBackground={theme.accentMuted}
              onPress={() => navigation.navigate('MyVehicles')}
            />
            <ActionTile
              title={t('addVehicle')}
              description={t('addVehicleHint')}
              icon="plus"
              accent={theme.accent}
              iconBackground={theme.accentMuted}
              onPress={() => navigation.navigate('AddVehicle')}
            />
          </>
        ) : (
          <>
            <ActionTile
              title={t('discover')}
              description={t('discoverHint')}
              icon="compass"
              accent={theme.accent}
              iconBackground={theme.accentMuted}
              onPress={() => navigation.navigate('Discovery')}
            />
            <ActionTile
              title={t('searchCnic')}
              description={t('searchCnicHint')}
              icon="id"
              accent={theme.accent}
              iconBackground={theme.accentMuted}
              onPress={() => navigation.navigate('ProfileSearch')}
            />
          </>
        )}
        <ActionTile
          title={t('rentals')}
          description={isOwnerMode ? t('ownerRentalsHint') : t('renterRentalsHint')}
          icon="calendar"
          accent={theme.accent}
          iconBackground={theme.accentMuted}
          onPress={() => navigation.navigate('Rentals')}
        />
        <ActionTile
          title={t('notifications')}
          description={t('notificationsHint')}
          icon="bell"
          accent={theme.accent}
          iconBackground={theme.accentMuted}
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
          accent={theme.accent}
          iconBackground={theme.accentMuted}
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
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  ownerStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.accent,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
