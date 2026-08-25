import { Alert, ScrollView, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlanLimits } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { PhotoCover } from '@/components/photo-cover';
import { QueryState } from '@/components/query-state';
import {
  useArchiveVehicleMutation,
  useDeleteVehiclePhotoMutation,
  useUpdateAvailabilityMutation,
  useUploadVehiclePhotoMutation,
  useVehicleQuery,
} from '@/api/hooks/use-vehicles';
import { useProfileQuery } from '@/api/hooks/use-auth';
import { useVehicleRatingsQuery } from '@/api/hooks/use-ratings';
import { RatingReviewList } from '@/features/ratings/components/rating-review-list';
import { RatingSummaryText } from '@/features/ratings/components/rating-summary-text';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'VehicleDetails'>;

export function VehicleDetailsScreen({ navigation, route }: Props) {
  const { t } = useTranslation('vehicles');
  const { vehicleId } = route.params;
  const vehicleQuery = useVehicleQuery(vehicleId);
  const ratingsQuery = useVehicleRatingsQuery(vehicleId);
  const availabilityMutation = useUpdateAvailabilityMutation(vehicleId);
  const uploadPhotoMutation = useUploadVehiclePhotoMutation(vehicleId);
  const deletePhotoMutation = useDeleteVehiclePhotoMutation(vehicleId);
  const archiveMutation = useArchiveVehicleMutation();

  const profileQuery = useProfileQuery();
  const vehicle = vehicleQuery.data;
  const isArchived = vehicle?.status === 'ARCHIVED';
  const limits = getPlanLimits(profileQuery.data?.plan);
  const photoCount = vehicle?.photos.length ?? 0;
  const atPhotoLimit = photoCount >= limits.maxVehiclePhotos;

  const toggleAvailability = () => {
    if (!vehicle) return;

    const next = vehicle.availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    availabilityMutation.mutate(next, {
      onError: (error) => Alert.alert(t('availabilityFailed'), error.message),
    });
  };

  const handleAddPhoto = async () => {
    if (atPhotoLimit) {
      Alert.alert(t('planLimitTitle'), t('photoPlanLimit', { limit: limits.maxVehiclePhotos }));
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel || !result.assets?.[0]?.uri || !result.assets[0].type) {
      return;
    }

    const asset = result.assets[0];
    uploadPhotoMutation.mutate(
      {
        uri: asset.uri!,
        type: asset.type!,
        name: asset.fileName ?? 'vehicle.jpg',
      },
      {
        onError: (error) => Alert.alert(t('uploadFailed'), error.message),
      },
    );
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(t('removePhoto'), t('removePhotoBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:delete'),
        style: 'destructive',
        onPress: () => {
          deletePhotoMutation.mutate(photoId, {
            onError: (error) => Alert.alert(t('deleteFailed'), error.message),
          });
        },
      },
    ]);
  };

  const handleArchive = () => {
    Alert.alert(t('archiveTitle'), t('archiveBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('archiveVehicle'),
        style: 'destructive',
        onPress: () => {
          archiveMutation.mutate(vehicleId, {
            onSuccess: () => {
              Alert.alert(t('archivedTitle'), t('archivedBody'), [
                { text: t('common:ok'), onPress: () => navigation.navigate('MyVehicles') },
              ]);
            },
            onError: (error) => Alert.alert(t('archiveFailed'), error.message),
          });
        },
      },
    ]);
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
            <AppText variant="body">{t('status', { status: vehicle.status })}</AppText>
            <AppText variant="body">
              {t('availability', {
                value:
                  vehicle.availability === 'AVAILABLE'
                    ? t('common:available')
                    : t('common:unavailable'),
              })}
            </AppText>
            {vehicle.areaLabel ? (
              <AppText variant="body">{t('area', { area: vehicle.areaLabel })}</AppText>
            ) : null}
            <RatingSummaryText summary={vehicle.rating} />
            <AppText variant="caption" style={styles.coords}>
              {t('location', { lat: vehicle.latitude, lon: vehicle.longitude })}
            </AppText>

            {!isArchived ? (
              <>
                <AppButton
                  title={
                    vehicle.availability === 'AVAILABLE'
                      ? t('markUnavailable')
                      : t('markAvailable')
                  }
                  variant="secondary"
                  loading={availabilityMutation.isPending}
                  onPress={toggleAvailability}
                />
                <AppButton
                  title={t('editDetails')}
                  variant="secondary"
                  onPress={() => navigation.navigate('EditVehicle', { vehicleId })}
                />
              </>
            ) : null}

            <AppText variant="label">{t('photos')}</AppText>
            <AppText variant="caption" style={styles.coords}>
              {t('photoPlanHint', { count: photoCount, limit: limits.maxVehiclePhotos })}
            </AppText>
            <PhotoCover
              photos={vehicle.photos}
              emptyLabel={t('noPhotos')}
              onRemovePhoto={isArchived ? undefined : handleDeletePhoto}
            />

            {!isArchived && !atPhotoLimit ? (
              <AppButton
                title={t('addPhoto')}
                icon="camera"
                loading={uploadPhotoMutation.isPending}
                onPress={() => {
                  void handleAddPhoto();
                }}
              />
            ) : null}

            {!isArchived ? (
              <AppButton
                title={t('archiveVehicle')}
                variant="secondary"
                loading={archiveMutation.isPending}
                onPress={handleArchive}
              />
            ) : null}

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
  coords: {
    color: colors.textSecondary,
  },
});
