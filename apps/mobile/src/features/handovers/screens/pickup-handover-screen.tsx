import { ScrollView, StyleSheet } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlanLimits } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
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
import { useProfileQuery } from '@/api/hooks/use-auth';
import { CnicProfileLookup } from '@/features/users/components/cnic-profile-lookup';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { showAppAlert } from '@/stores/app-alert-store';

type Props = NativeStackScreenProps<AppStackParamList, 'PickupHandover'>;

export function PickupHandoverScreen({ navigation, route }: Props) {
  const { t } = useTranslation('handovers');
  const { handoverId, rentalId, perspective } = route.params;
  const handoverQuery = useHandoverQuery(handoverId);
  const uploadMutation = useUploadHandoverPhotoMutation(handoverId, rentalId);
  const deleteMutation = useDeleteHandoverPhotoMutation(handoverId, rentalId);
  const submitMutation = useSubmitHandoverMutation(handoverId, rentalId);
  const approveMutation = useApproveHandoverMutation(handoverId, rentalId);

  const profileQuery = useProfileQuery();
  const handover = handoverQuery.data;
  const limits = getPlanLimits(profileQuery.data?.plan);
  const isOwnerView = perspective === 'owner';
  const canEditPhotos = isOwnerView && handover?.status === 'OWNER_PHOTOS_REQUIRED';
  const photoCount = handover?.photos.length ?? 0;
  const atEvidenceLimit = photoCount >= limits.maxHandoverPhotos;
  const canSubmit = canEditPhotos && photoCount >= MIN_PICKUP_HANDOVER_PHOTOS;
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
        onError: (error) => showAppAlert(t('uploadFailed'), error.message),
      },
    );
  };

  const handleAddPhoto = () => {
    if (atEvidenceLimit) {
      showAppAlert(t('planLimitTitle'), t('planLimitBody', { limit: limits.maxHandoverPhotos }));
      return;
    }

    showAppAlert(t('addPhoto'), t('addPhotoBody'), [
      { text: t('camera'), onPress: () => void pickPhoto(true) },
      { text: t('gallery'), onPress: () => void pickPhoto(false) },
      { text: t('common:cancel'), style: 'cancel' },
    ]);
  };

  const handleDeletePhoto = (photoId: string) => {
    showAppAlert(t('removePhoto'), t('removePhotoBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:remove'),
        style: 'destructive',
        onPress: () => {
          deleteMutation.mutate(photoId, {
            onError: (error) => showAppAlert(t('removeFailed'), error.message),
          });
        },
      },
    ]);
  };

  const handleSubmit = () => {
    showAppAlert(t('submitTitle'), t('submitBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:submit'),
        onPress: () => {
          submitMutation.mutate(undefined, {
            onSuccess: () => {
              showAppAlert(t('submittedTitle'), t('submittedBody'));
            },
            onError: (error) => showAppAlert(t('submitFailed'), error.message),
          });
        },
      },
    ]);
  };

  const handleApprove = () => {
    showAppAlert(t('approveTitle'), t('approveBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:approve'),
        onPress: () => {
          approveMutation.mutate(undefined, {
            onSuccess: () => {
              showAppAlert(t('approvedTitle'), t('approvedBody'));
            },
            onError: (error) => showAppAlert(t('approvalFailed'), error.message),
          });
        },
      },
    ]);
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
            <AppText variant="title">{t('title')}</AppText>
            <AppText variant="body">
              {t('statusLabel', { status: getHandoverStatusLabel(handover.status) })}
            </AppText>
            <AppText variant="body">
              {t('vehicle', {
                year: handover.vehicle.year,
                make: handover.vehicle.make,
                model: handover.vehicle.model,
              })}
            </AppText>
            <AppText variant="body">
              {t('rentals:counterparty', {
                role: isOwnerView ? t('common:renter') : t('common:owner'),
                name: isOwnerView ? handover.renter.fullName : handover.owner.fullName,
              })}
            </AppText>
            <CnicProfileLookup participant={isOwnerView ? 'renter' : 'owner'} />
            {handover.submittedAt ? (
              <AppText variant="body">
                {t('submitted', { date: formatRentalDate(handover.submittedAt) })}
              </AppText>
            ) : null}

            <AppText variant="label">{t('evidence')}</AppText>
            <HandoverPhotoGrid
              photos={handover.photos}
              onRemovePhoto={canEditPhotos ? handleDeletePhoto : undefined}
            />

            {canEditPhotos ? (
              <>
                <AppText variant="body">
                  {t('photoProgress', {
                    count: photoCount,
                    min: MIN_PICKUP_HANDOVER_PHOTOS,
                    max: limits.maxHandoverPhotos,
                  })}
                </AppText>
                {!atEvidenceLimit ? (
                  <AppButton
                    title={t('takePhoto')}
                    icon="camera"
                    loading={uploadMutation.isPending}
                    onPress={handleAddPhoto}
                  />
                ) : null}
                <AppButton
                  title={t('submitSet')}
                  loading={submitMutation.isPending}
                  disabled={!canSubmit}
                  onPress={handleSubmit}
                />
              </>
            ) : null}

            {canApprove ? (
              <AppButton
                title={t('approveEvidence')}
                loading={approveMutation.isPending}
                onPress={handleApprove}
              />
            ) : null}

            {isApproved ? (
              <AppText variant="body">{t('approvedHint')}</AppText>
            ) : null}

            {!isOwnerView && handover.status === 'OWNER_PHOTOS_REQUIRED' ? (
              <AppText variant="body">{t('waitingOwner')}</AppText>
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
