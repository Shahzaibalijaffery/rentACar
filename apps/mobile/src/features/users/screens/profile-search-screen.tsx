import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserProfileSearchResult } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { useSearchUserByCnicMutation } from '@/api/hooks/use-users';
import { ProfileVehicleCard } from '@/features/users/components/profile-vehicle-card';
import type { AppStackParamList } from '@/navigation/types';
import { colors, radii, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'ProfileSearch'>;

export function ProfileSearchScreen({ navigation }: Props) {
  const [cnic, setCnic] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfileSearchResult | null>(null);
  const searchMutation = useSearchUserByCnicMutation();

  const handleSearch = () => {
    const trimmedCnic = cnic.trim();
    if (!trimmedCnic) {
      Alert.alert('CNIC required', 'Enter a CNIC number to search for a profile.');
      return;
    }

    searchMutation.mutate(
      { cnic: trimmedCnic },
      {
        onSuccess: (data) => {
          setSearchResult(data);
        },
        onError: (error) => {
          setSearchResult(null);
          Alert.alert('Profile not found', error.message);
        },
      },
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText variant="title">Search by CNIC</AppText>
      <AppText variant="body">
        Find another user&apos;s profile and browse their listed vehicles. Enter their CNIC to
        search.
      </AppText>

      <AppInput
        placeholder="35201-1234567-1"
        value={cnic}
        onChangeText={setCnic}
        keyboardType="number-pad"
      />
      <AppButton title="Search profile" loading={searchMutation.isPending} onPress={handleSearch} />

      {searchResult ? (
        <View style={styles.resultSection}>
          <View style={styles.profileCard}>
            {searchResult.user.profilePhotoUrl ? (
              <Image
                source={{ uri: searchResult.user.profilePhotoUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <AppText variant="title">{searchResult.user.fullName.charAt(0)}</AppText>
              </View>
            )}
            <AppText variant="title">{searchResult.user.fullName}</AppText>
          </View>

          <AppText variant="label">Listed vehicles</AppText>
          {searchResult.vehicles.length === 0 ? (
            <AppText variant="body">This user has no active vehicle listings.</AppText>
          ) : (
            searchResult.vehicles.map((vehicle) => (
              <ProfileVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPress={() =>
                  navigation.navigate('DiscoveryVehicleDetail', {
                    vehicleId: vehicle.id,
                  })
                }
              />
            ))
          )}
        </View>
      ) : null}

      <AppButton title="Back" variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  resultSection: {
    gap: spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundSecondary,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
});
