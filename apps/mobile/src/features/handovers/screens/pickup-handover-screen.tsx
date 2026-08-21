import { Alert, ScrollView, StyleSheet } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { QueryState } from '@/components/query-state';
import {
  useApproveHandoverMutation,
  useDeleteHandoverPhotoMutation,
  useHandoverQuery,
  useSubmitHandoverMutation,
  useUploadHandoverPhotoMutation,
} from '@/api/hooks/use-handovers';
import { HandoverPhotoGrid } from '@/features/handovers/components/handover-photo-grid';
import {
  getHandoverStatusLabel,
  MIN_PICKUP_HANDOVER_PHOTOS,
} from '@/features/handovers/handover-utils';
import { formatRentalDate } from '@/features/rentals/rental-utils';
import { CnicProfileLookup } from '@/features/users/components/cnic-profile-lookup';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'PickupHandover'>;

export function PickupHandoverScreen({ navigation, route }: Props) {
  const { handoverId, rentalId, perspective } = route.params;
  const handoverQuery = useHandoverQuery(handoverId);
  const uploadMutation = useUploadHandoverPhotoMutation(handoverId, rentalId);
  const deleteMutation = useDeleteHandoverPhotoMutation(handoverId, rentalId);
  const submitMutation = useSubmitHandoverMutation(handoverId, rentalId);
  const approveMutation = useApproveHandoverMutation(handoverId, rentalId);

  const handover = handoverQuery.data;
  const isOwnerView = perspective === 'owner';
  const canEditPhotos = isOwnerView && handover?.status === 'OWNER_PHOTOS_REQUIRED';
  const canSubmit = canEditPhotos && (handover?.photos.length ?? 0) >= MIN_PICKUP_HANDOVER_PHOTOS;
  const canApprove = !isOwnerView && handover?.status === 'RENTER_APPROVAL_REQUIRED';
  const isApproved = handover?.status === 'APPROVED';

  const pickPhoto = async (useCamera: boolean) => {
    const result = useCamera
      ? await launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false })
      : await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });

    if (result.didCancel || !result.assets?.[0]?.uri || !result.assets[0].type) {
      return;
    }

    const asset = result.assets[0];
    uploadMutation.mutate(
      {
        uri: asset.uri!,
        type: asset.type!,
        name: asset.fileName ?? 'handover.jpg',
      },
      {
        onError: (error) => Alert.alert('Upload failed', error.message),
      },
    );
  };

  const handleAddPhoto = () => {
    Alert.alert('Add photo', 'Choose a source for the vehicle condition photo.', [
      { text: 'Camera', onPress: () => void pickPhoto(true) },
      { text: 'Gallery', onPress: () => void pickPhoto(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Remove photo', 'Remove this photo before submission?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deleteMutation.mutate(photoId, {
            onError: (error) => Alert.alert('Remove failed', error.message),
          });
        },
      },
    ]);
  };

  const handleSubmit = () => {
    Alert.alert(
      'Submit pickup photos',
      'After submission, these photos become official evidence and cannot be changed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            submitMutation.mutate(undefined, {
              onSuccess: () => {
                Alert.alert(
                  'Photos submitted',
                  'The renter can now review and approve the pickup evidence.',
                );
              },
              onError: (error) => Alert.alert('Submit failed', error.message),
            });
          },
        },
      ],
    );
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve pickup evidence',
      'Confirm that you approve the vehicle condition shown in these photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            approveMutation.mutate(undefined, {
              onSuccess: () => {
                Alert.alert('Pickup approved', 'The rental is now active.');
              },
              onError: (error) => Alert.alert('Approval failed', error.message),
            });
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <QueryState
        isLoading={handoverQuery.isLoading}
        isError={handoverQuery.isError}
        errorMessage={handoverQuery.error?.message}
      >
        {handover ? (
          <>
            <AppText variant="title">Pickup handover</AppText>
            <AppText variant="body">Status: {getHandoverStatusLabel(handover.status)}</AppText>
            <AppText variant="body">
              Vehicle: {handover.vehicle.year} {handover.vehicle.make} {handover.vehicle.model}
            </AppText>
            <AppText variant="body">
              {isOwnerView ? 'Renter' : 'Owner'}:{' '}
              {isOwnerView ? handover.renter.fullName : handover.owner.fullName}
            </AppText>
            <CnicProfileLookup participantLabel={isOwnerView ? 'renter' : 'owner'} />
            {handover.submittedAt ? (
              <AppText variant="body">Submitted: {formatRentalDate(handover.submittedAt)}</AppText>
            ) : null}

            <AppText variant="label">Submitted evidence</AppText>
            <HandoverPhotoGrid photos={handover.photos} />

            {canEditPhotos ? (
              <>
                <AppText variant="body">
                  Photos: {handover.photos.length} / minimum {MIN_PICKUP_HANDOVER_PHOTOS}
                </AppText>
                <AppButton
                  title="Add photo"
                  loading={uploadMutation.isPending}
                  onPress={handleAddPhoto}
                />
                {handover.photos.map((photo) => (
                  <AppButton
                    key={photo.id}
                    title={`Remove photo ${photo.sortOrder + 1}`}
                    variant="secondary"
                    loading={deleteMutation.isPending}
                    onPress={() => handleDeletePhoto(photo.id)}
                  />
                ))}
                <AppButton
                  title="Submit photo set"
                  loading={submitMutation.isPending}
                  disabled={!canSubmit}
                  onPress={handleSubmit}
                />
              </>
            ) : null}

            {canApprove ? (
              <AppButton
                title="Approve pickup evidence"
                loading={approveMutation.isPending}
                onPress={handleApprove}
              />
            ) : null}

            {isApproved ? (
              <AppText variant="body">
                Pickup handover is complete. Both parties reviewed the same submitted photo set.
              </AppText>
            ) : null}

            {!isOwnerView && handover.status === 'OWNER_PHOTOS_REQUIRED' ? (
              <AppText variant="body">
                Waiting for the owner to capture and submit pickup photos.
              </AppText>
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
});
