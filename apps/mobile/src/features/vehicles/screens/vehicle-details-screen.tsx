import { Alert, ScrollView, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlanLimits } from '@rentacar/shared';
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
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'VehicleDetails'>;

export function VehicleDetailsScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const vehicleQuery = useVehicleQuery(vehicleId);
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
      onError: (error) => Alert.alert('Could not update availability', error.message),
    });
  };

  const handleAddPhoto = async () => {
    if (atPhotoLimit) {
      Alert.alert(
        'Plan limit',
        `Your plan allows ${limits.maxVehiclePhotos} photos per vehicle.`,
      );
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
        onError: (error) => Alert.alert('Upload failed', error.message),
      },
    );
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Remove photo', 'Delete this vehicle photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePhotoMutation.mutate(photoId, {
            onError: (error) => Alert.alert('Delete failed', error.message),
          });
        },
      },
    ]);
  };

  const handleArchive = () => {
    Alert.alert('Archive vehicle', 'This hides the vehicle from listings. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => {
          archiveMutation.mutate(vehicleId, {
            onSuccess: () => {
              Alert.alert('Archived', 'Vehicle archived successfully', [
                { text: 'OK', onPress: () => navigation.navigate('MyVehicles') },
              ]);
            },
            onError: (error) => Alert.alert('Archive failed', error.message),
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
            <AppText variant="body">Color: {vehicle.color}</AppText>
            <AppText variant="body">Status: {vehicle.status}</AppText>
            <AppText variant="body">Availability: {vehicle.availability}</AppText>
            {vehicle.areaLabel ? <AppText variant="body">Area: {vehicle.areaLabel}</AppText> : null}
            <AppText variant="caption" style={styles.coords}>
              Location: {vehicle.latitude}, {vehicle.longitude}
            </AppText>

            {!isArchived ? (
              <>
                <AppButton
                  title={
                    vehicle.availability === 'AVAILABLE' ? 'Mark unavailable' : 'Mark available'
                  }
                  variant="secondary"
                  loading={availabilityMutation.isPending}
                  onPress={toggleAvailability}
                />
                <AppButton
                  title="Edit details"
                  variant="secondary"
                  onPress={() => navigation.navigate('EditVehicle', { vehicleId })}
                />
              </>
            ) : null}

            <AppText variant="label">Photos</AppText>
            <AppText variant="caption" style={styles.coords}>
              {photoCount} of {limits.maxVehiclePhotos} photos on your plan
            </AppText>
            <PhotoCover
              photos={vehicle.photos}
              emptyLabel="No vehicle photos yet"
              onRemovePhoto={isArchived ? undefined : handleDeletePhoto}
            />

            {!isArchived && !atPhotoLimit ? (
              <AppButton
                title="Add photo"
                icon="camera"
                loading={uploadPhotoMutation.isPending}
                onPress={() => {
                  void handleAddPhoto();
                }}
              />
            ) : null}

            {!isArchived ? (
              <AppButton
                title="Archive vehicle"
                variant="secondary"
                loading={archiveMutation.isPending}
                onPress={handleArchive}
              />
            ) : null}
          </>
        ) : null}
      </QueryState>

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
  coords: {
    color: colors.textSecondary,
  },
});
