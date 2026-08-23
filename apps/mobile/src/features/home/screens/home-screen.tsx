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
import { useLogoutMutation, useProfileQuery } from '@/api/hooks/use-auth';
import type { AppStackParamList } from '@/navigation/types';
import { useAppModeStore } from '@/stores/app-mode-store';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const profileQuery = useProfileQuery();
  const logoutMutation = useLogoutMutation();
  const activeMode = useAppModeStore((state) => state.activeMode);
  const isOwnerMode = activeMode === 'owner';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isOwnerMode ? 'Owner hub' : 'Renter hub',
    });
  }, [navigation, isOwnerMode]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onError: (error) => {
        Alert.alert('Logout failed', error.message);
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
            {isOwnerMode ? 'Owner profile' : 'Renter profile'}
          </AppText>
          <AppText variant="title" style={styles.heroTitle}>
            Hello, {profileQuery.data?.fullName ?? 'there'}
          </AppText>
          {profileQuery.data ? <PlanBadge plan={profileQuery.data.plan} /> : null}
          <AppText variant="body" style={styles.heroSubtitle}>
            {isOwnerMode
              ? 'Manage listings and keep track of your rentals.'
              : 'Discover cars nearby and keep track of your rentals.'}
          </AppText>
        </AppCard>
      </QueryState>

      <AppModeSwitcher />

      <View style={styles.section}>
        <AppText variant="label" style={styles.sectionLabel}>
          Quick actions
        </AppText>
        {isOwnerMode ? (
          <>
            <ActionTile
              title="My vehicles"
              description="View and manage your listed cars"
              icon="car"
              accent={colors.primary}
              onPress={() => navigation.navigate('MyVehicles')}
            />
            <ActionTile
              title="Add a vehicle"
              description="List a new car for rent"
              icon="plus"
              accent={colors.accent}
              onPress={() => navigation.navigate('AddVehicle')}
            />
          </>
        ) : (
          <>
            <ActionTile
              title="Discover vehicles"
              description="Browse available cars near you"
              icon="compass"
              accent={colors.primary}
              onPress={() => navigation.navigate('Discovery')}
            />
            <ActionTile
              title="Search by CNIC"
              description="Find an owner and their listings"
              icon="id"
              accent={colors.accent}
              onPress={() => navigation.navigate('ProfileSearch')}
            />
          </>
        )}
        <ActionTile
          title="Rentals"
          description="Requests, active trips, and history"
          icon="calendar"
          onPress={() => navigation.navigate('Rentals')}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="label" style={styles.sectionLabel}>
          Account
        </AppText>
        <ActionTile
          title="My profile"
          description="Update name, photo, and switch profile"
          icon="user"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      <AppButton
        title="Log out"
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
