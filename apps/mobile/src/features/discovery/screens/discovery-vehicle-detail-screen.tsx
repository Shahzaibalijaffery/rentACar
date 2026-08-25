import { Alert, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DEFAULT_RENTAL_AGREEMENT_TERMS } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { PhotoCover } from '@/components/photo-cover';
import { QueryState } from '@/components/query-state';
import { useProfileQuery } from '@/api/hooks/use-auth';
import { useCreateRentalMutation } from '@/api/hooks/use-rentals';
import { usePublicVehicleQuery } from '@/api/hooks/use-discovery';
import { useVehicleRatingsQuery } from '@/api/hooks/use-ratings';
import { RatingReviewList } from '@/features/ratings/components/rating-review-list';
import { RatingSummaryText } from '@/features/ratings/components/rating-summary-text';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'DiscoveryVehicleDetail'>;

export function DiscoveryVehicleDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation('discovery');
  const { vehicleId, distanceLabel } = route.params;
  const vehicleQuery = usePublicVehicleQuery(vehicleId);
  const ratingsQuery = useVehicleRatingsQuery(vehicleId);
  const profileQuery = useProfileQuery();
  const createRentalMutation = useCreateRentalMutation();

  const vehicle = vehicleQuery.data;
  const isOwnVehicle = Boolean(vehicle && profileQuery.data?.id === vehicle.owner.id);
  const canRequestRental = vehicle?.availability === 'AVAILABLE' && !isOwnVehicle;

  const handleRequestRental = () => {
    if (!vehicle) {
      return;
    }

    Alert.alert(
      t('requestTitle'),
      t('requestBody', {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        terms: DEFAULT_RENTAL_AGREEMENT_TERMS,
      }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('sendRequest'),
          onPress: () => {
            createRentalMutation.mutate(
              { vehicleId: vehicle.id },
              {
                onSuccess: (rental) => {
                  Alert.alert(t('requestSent'), t('requestSentBody'), [
                    {
                      text: t('viewRequest'),
                      onPress: () =>
                        navigation.navigate('RentalRequestDetail', {
                          rentalId: rental.id,
                          perspective: 'renter',
                        }),
                    },
                    { text: t('common:ok') },
                  ]);
                },
                onError: (error) => Alert.alert(t('requestFailed'), error.message),
              },
            );
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <QueryState
        isLoading={vehicleQuery.isLoading}
        isError={vehicleQuery.isError}
        errorMessage={vehicleQuery.error?.message}
      >
        {vehicle ? (
          <>
            <AppText variant="title">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </AppText>
            <AppText variant="body">{t('color', { color: vehicle.color })}</AppText>
            <AppText variant="body">
              {t('availability', {
                value:
                  vehicle.availability === 'AVAILABLE'
                    ? t('common:available')
                    : t('common:unavailable'),
              })}
            </AppText>
            {distanceLabel ? <AppText variant="body">{distanceLabel}</AppText> : null}
            {vehicle.areaLabel ? (
              <AppText variant="body">{t('area', { area: vehicle.areaLabel })}</AppText>
            ) : null}
            <AppText variant="body">{t('owner', { name: vehicle.owner.fullName })}</AppText>
            <RatingSummaryText summary={vehicle.rating} />

            <AppText variant="label">{t('photos')}</AppText>
            <PhotoCover photos={vehicle.photos} emptyLabel={t('noVehiclePhotos')} />

            {isOwnVehicle ? (
              <AppText variant="body">{t('ownVehicle')}</AppText>
            ) : canRequestRental ? (
              <AppButton
                title={t('requestRental')}
                loading={createRentalMutation.isPending}
                onPress={handleRequestRental}
              />
            ) : (
              <AppText variant="body">{t('notAvailable')}</AppText>
            )}

            {ratingsQuery.data ? (
              <RatingReviewList
                title={t('ratings:title')}
                summary={ratingsQuery.data.summary}
                reviews={ratingsQuery.data.reviews}
              />
            ) : null}
          </>
        ) : null}
      </QueryState>

      <AppButton title={t('common:back')} variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
});
