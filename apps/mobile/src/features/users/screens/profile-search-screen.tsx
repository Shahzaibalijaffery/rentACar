import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserProfileSearchResult } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useSearchUserByCnicMutation } from '@/api/hooks/use-users';
import { useRenterRatingsQuery } from '@/api/hooks/use-ratings';
import { RatingReviewList } from '@/features/ratings/components/rating-review-list';
import { ProfileVehicleCard } from '@/features/users/components/profile-vehicle-card';
import type { AppStackParamList } from '@/navigation/types';
import { colors, radii, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'ProfileSearch'>;

export function ProfileSearchScreen({ navigation }: Props) {
  const { t } = useTranslation('users');
  const [cnic, setCnic] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfileSearchResult | null>(null);
  const searchMutation = useSearchUserByCnicMutation();
  const renterRatingsQuery = useRenterRatingsQuery(
    searchResult?.user.id ?? '',
    Boolean(searchResult),
  );

  const handleSearch = () => {
    const trimmedCnic = cnic.trim();
    if (!trimmedCnic) {
      Alert.alert(t('cnicRequired'), t('cnicRequiredBody'));
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
          Alert.alert(t('notFound'), error.message);
        },
      },
    );
  };

  return (
    <KeyboardAwareScroll contentContainerStyle={styles.container}>
      <AppText variant="title">{t('searchTitle')}</AppText>
      <AppText variant="body">{t('searchHint')}</AppText>

      <AppInput
        icon="id"
        placeholder="35201-1234567-1"
        value={cnic}
        onChangeText={setCnic}
        keyboardType="number-pad"
      />
      <AppButton
        title={t('searchCta')}
        icon="search"
        loading={searchMutation.isPending}
        onPress={handleSearch}
      />

      {searchResult ? (
        <View style={styles.resultSection}>
          <View style={styles.profileCard}>
            <ProfileAvatar
              fullName={searchResult.user.fullName}
              profilePhotoUrl={searchResult.user.profilePhotoUrl}
              size={80}
            />
            <AppText variant="title">{searchResult.user.fullName}</AppText>
          </View>

          {renterRatingsQuery.data ? (
            <RatingReviewList
              title={t('ratings:title')}
              summary={renterRatingsQuery.data.summary}
              reviews={renterRatingsQuery.data.reviews}
            />
          ) : null}

          <AppText variant="label">{t('listedVehicles')}</AppText>
          {searchResult.vehicles.length === 0 ? (
            <AppText variant="body">{t('noVehicles')}</AppText>
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

      <AppButton title={t('common:back')} variant="secondary" onPress={() => navigation.goBack()} />
    </KeyboardAwareScroll>
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
});
