import { useLayoutEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppModeSwitcher } from '@/components/app-mode-switcher';
import { AppText } from '@/components/app-text';
import { QueryState } from '@/components/query-state';
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
      title: isOwnerMode ? 'RentACar — Owner' : 'RentACar — Renter',
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
    <View style={styles.container}>
      <QueryState
        isLoading={profileQuery.isLoading}
        isError={profileQuery.isError}
        errorMessage={profileQuery.error?.message}
      >
        <AppText variant="title">Welcome, {profileQuery.data?.fullName}</AppText>
        <AppText variant="body">
          {isOwnerMode
            ? 'You are in owner mode — manage listings and incoming requests.'
            : 'You are in renter mode — discover vehicles and track your rentals.'}
        </AppText>
      </QueryState>

      <AppModeSwitcher />

      {isOwnerMode ? (
        <>
          <AppButton title="My vehicles" onPress={() => navigation.navigate('MyVehicles')} />
          <AppButton
            title="Add vehicle"
            variant="secondary"
            onPress={() => navigation.navigate('AddVehicle')}
          />
          <AppButton
            title="Incoming rental requests"
            onPress={() => navigation.navigate('OwnerRentalRequests')}
          />
          <AppButton
            title="Active rentals"
            variant="secondary"
            onPress={() => navigation.navigate('OwnerRentalRequests', { lifecycle: 'active' })}
          />
          <AppButton
            title="Completed rentals"
            variant="secondary"
            onPress={() => navigation.navigate('OwnerRentalRequests', { lifecycle: 'completed' })}
          />
        </>
      ) : (
        <>
          <AppButton title="Discover vehicles" onPress={() => navigation.navigate('Discovery')} />
          <AppButton
            title="Search profile by CNIC"
            onPress={() => navigation.navigate('ProfileSearch')}
          />
          <AppButton
            title="My rental requests"
            onPress={() => navigation.navigate('MyRentalRequests')}
          />
          <AppButton
            title="My active rentals"
            variant="secondary"
            onPress={() => navigation.navigate('MyRentalRequests', { lifecycle: 'active' })}
          />
          <AppButton
            title="My completed rentals"
            variant="secondary"
            onPress={() => navigation.navigate('MyRentalRequests', { lifecycle: 'completed' })}
          />
        </>
      )}

      <AppButton title="My profile" variant="secondary" onPress={() => navigation.navigate('Profile')} />

      <AppButton
        title="Log out"
        variant="secondary"
        loading={logoutMutation.isPending}
        onPress={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
