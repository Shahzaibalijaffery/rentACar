import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { QueryState } from '@/components/query-state';
import {
  useAcceptRentalMutation,
  useCancelRentalMutation,
  useCompleteRentalMutation,
  useRejectRentalMutation,
  useRentalQuery,
} from '@/api/hooks/use-rentals';
import { useAgreementByRentalQuery, useApproveAgreementMutation } from '@/api/hooks/use-agreements';
import { useProfileQuery } from '@/api/hooks/use-auth';
import { useOpenPickupPhotos } from '@/features/handovers/use-open-pickup-photos';
import { hasUserApprovedAgreement } from '@/features/agreements/agreement-utils';
import { RentalNextStepCard } from '@/features/rentals/components/rental-next-step-card';
import { RentalRequestProfileCard } from '@/features/rentals/components/rental-request-profile-card';
import {
  formatRentalDate,
  getRentalNextStep,
  getRentalStatusLabel,
} from '@/features/rentals/rental-utils';
import { PhotoCover } from '@/components/photo-cover';
import { useRentalRatingsQuery } from '@/api/hooks/use-ratings';
import { RateRentalCard } from '@/features/ratings/components/rate-rental-card';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { showAppAlert } from '@/stores/app-alert-store';

type Props = NativeStackScreenProps<AppStackParamList, 'RentalRequestDetail'>;

export function RentalRequestDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation('rentals');
  const { rentalId, perspective } = route.params;
  const rentalQuery = useRentalQuery(rentalId);
  const profileQuery = useProfileQuery();
  const acceptMutation = useAcceptRentalMutation(rentalId);
  const rejectMutation = useRejectRentalMutation(rentalId);
  const cancelMutation = useCancelRentalMutation(rentalId);
  const completeMutation = useCompleteRentalMutation(rentalId);

  const rental = rentalQuery.data;
  const userId = profileQuery.data?.id;
  const isPending = rental?.status === 'PENDING';
  const isAccepted = rental?.status === 'ACCEPTED';
  const isAgreementPending = rental?.status === 'AGREEMENT_PENDING';
  const isPickupPending = rental?.status === 'PICKUP_PENDING';
  const isPickupApprovalPending = rental?.status === 'PICKUP_APPROVAL_PENDING';
  const isActive = rental?.status === 'ACTIVE';
  const isCompleted = rental?.status === 'COMPLETED';
  const isRated = rental?.status === 'RATED';
  const isFinished = isCompleted || isRated;
  const isOwnerView = perspective === 'owner';
  const canCancelAfterAccept =
    isAccepted || isAgreementPending || isPickupPending || isPickupApprovalPending || isActive;

  const agreementQuery = useAgreementByRentalQuery(
    rentalId,
    Boolean(
      rental &&
      (isAccepted ||
        isAgreementPending ||
        isPickupPending ||
        isPickupApprovalPending ||
        isActive ||
        isFinished ||
        Boolean(rental.agreementId)),
    ),
  );

  const agreement = agreementQuery.data;
  const approveAgreementMutation = useApproveAgreementMutation(agreement?.id ?? '', rentalId);
  const userApprovedAgreement =
    agreement && userId ? hasUserApprovedAgreement(agreement, userId) : false;
  const canApproveAgreement =
    isAgreementPending &&
    agreement?.status === 'PENDING_APPROVAL' &&
    !userApprovedAgreement &&
    Boolean(agreement);

  const { handover, openPickupPhotos, isOpening } = useOpenPickupPhotos(
    rentalId,
    Boolean(
      rental &&
      (isAccepted || isPickupPending || isPickupApprovalPending || isActive || isFinished),
    ),
  );

  const ratingsQuery = useRentalRatingsQuery(rentalId, isFinished);
  const ratings = ratingsQuery.data;

  const nextStep = rental
    ? getRentalNextStep({
        status: rental.status,
        perspective,
        hasAgreement: Boolean(agreement),
        userApprovedAgreement,
        agreementFullyApproved: agreement?.status === 'APPROVED',
        handoverStatus: handover?.status,
        hasSubmittedRating: Boolean(ratings?.myRating),
      })
    : null;

  const handleAccept = () => {
    acceptMutation.mutate(undefined, {
      onSuccess: () => {
        showAppAlert(t('acceptedTitle'), t('acceptedBody'));
      },
      onError: (error) => showAppAlert(t('acceptFailed'), error.message),
    });
  };

  const handleReject = () => {
    showAppAlert(t('rejectTitle'), t('rejectBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('rejectRequest'),
        style: 'destructive',
        onPress: () => {
          rejectMutation.mutate(undefined, {
            onSuccess: () => {
              showAppAlert(t('rejectedTitle'), t('rejectedBody'));
            },
            onError: (error) => showAppAlert(t('rejectFailed'), error.message),
          });
        },
      },
    ]);
  };

  const handleCancel = () => {
    showAppAlert(
      isPending ? t('cancelRequestTitle') : t('cancelRentalTitle'),
      isPending ? t('cancelRequestBody') : t('cancelRentalBody'),
      [
        { text: t('common:keep'), style: 'cancel' },
        {
          text: isPending ? t('cancelRequest') : t('cancelRental'),
          style: 'destructive',
          onPress: () => {
            cancelMutation.mutate(undefined, {
              onSuccess: () => {
                showAppAlert(
                  isPending ? t('cancelledRequestTitle') : t('cancelledRentalTitle'),
                  isPending ? t('cancelledRequestBody') : t('cancelledRentalBody'),
                );
              },
              onError: (error) => showAppAlert(t('cancelFailed'), error.message),
            });
          },
        },
      ],
    );
  };

  const handleApproveAgreement = () => {
    showAppAlert(t('approveAgreementTitle'), t('approveAgreementBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:approve'),
        onPress: () => {
          approveAgreementMutation.mutate(undefined, {
            onSuccess: (updated) => {
              if (updated.status === 'APPROVED') {
                if (isOwnerView) {
                  showAppAlert(t('agreementApprovedTitle'), t('agreementApprovedOwner'), [
                    {
                      text: t('takePickupPhotos'),
                      onPress: () => openPickupPhotos(navigation, 'owner'),
                    },
                    { text: t('common:later'), style: 'cancel' },
                  ]);
                } else {
                  showAppAlert(t('agreementApprovedTitle'), t('agreementApprovedRenter'));
                }
              } else {
                showAppAlert(t('approvalRecorded'), t('approvalRecordedBody'));
              }
            },
            onError: (error) => showAppAlert(t('approvalFailed'), error.message),
          });
        },
      },
    ]);
  };

  const handleComplete = () => {
    showAppAlert(t('completeTitle'), t('completeBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('completeRental'),
        onPress: () => {
          completeMutation.mutate(undefined, {
            onSuccess: () => {
              showAppAlert(t('completedTitle'), t('completedBody'));
            },
            onError: (error) => showAppAlert(t('completeFailed'), error.message),
          });
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <QueryState
        isLoading={rentalQuery.isLoading || profileQuery.isLoading}
        isError={rentalQuery.isError}
        errorMessage={rentalQuery.error?.message}
      >
        {rental ? (
          <>
            <AppText variant="title">
              {rental.vehicle.year} {rental.vehicle.make} {rental.vehicle.model}
            </AppText>
            <PhotoCover photos={rental.vehicle.photos} emptyLabel={t('noVehiclePhotos')} />
            <AppText variant="body">
              {t('statusLabel', { status: getRentalStatusLabel(rental.status) })}
            </AppText>

            {nextStep ? <RentalNextStepCard step={nextStep} /> : null}

            <RentalRequestProfileCard
              label={isOwnerView ? t('common:renter') : t('common:owner')}
              profile={isOwnerView ? rental.renterProfile : rental.ownerProfile}
              phone={isOwnerView ? rental.contact?.renterPhone : rental.contact?.ownerPhone}
            />

            {isOwnerView && isPending ? (
              <View style={styles.actions}>
                <AppButton
                  title={t('acceptRequest')}
                  loading={acceptMutation.isPending}
                  onPress={handleAccept}
                />
                <AppButton
                  title={t('rejectRequest')}
                  variant="secondary"
                  loading={rejectMutation.isPending}
                  onPress={handleReject}
                />
              </View>
            ) : null}

            {!isOwnerView && isPending ? (
              <AppButton
                title={t('cancelRequest')}
                variant="secondary"
                loading={cancelMutation.isPending}
                onPress={handleCancel}
              />
            ) : null}

            {canCancelAfterAccept ? (
              <AppButton
                title={t('cancelRental')}
                variant="secondary"
                loading={cancelMutation.isPending}
                onPress={handleCancel}
              />
            ) : null}

            {isOwnerView && isAccepted && !agreement ? (
              <AppButton
                title={t('createAgreement')}
                onPress={() => navigation.navigate('CreateAgreement', { rentalId })}
              />
            ) : null}

            {canApproveAgreement ? (
              <AppButton
                title={t('approveAgreement')}
                loading={approveAgreementMutation.isPending}
                onPress={handleApproveAgreement}
              />
            ) : null}

            {isOwnerView && (isAccepted || isPickupPending) ? (
              <AppButton
                title={t('startPickup')}
                loading={isOpening}
                onPress={() => openPickupPhotos(navigation, 'owner')}
              />
            ) : null}

            {(isPickupApprovalPending || isActive || isFinished) && handover ? (
              <AppButton
                title={
                  isPickupApprovalPending && !isOwnerView ? t('reviewPickup') : t('viewPickup')
                }
                onPress={() => openPickupPhotos(navigation, perspective)}
              />
            ) : null}

            {isActive && isOwnerView ? (
              <AppButton
                title={t('completeRental')}
                loading={completeMutation.isPending}
                onPress={handleComplete}
              />
            ) : null}

            <AppText variant="label">{t('common:details')}</AppText>
            <AppText variant="body">{t('color', { color: rental.vehicle.color })}</AppText>
            {rental.vehicle.areaLabel ? (
              <AppText variant="body">{t('area', { area: rental.vehicle.areaLabel })}</AppText>
            ) : null}
            <AppText variant="body">
              {t('counterparty', {
                role: isOwnerView ? t('common:renter') : t('common:owner'),
                name: isOwnerView ? rental.renter.fullName : rental.owner.fullName,
              })}
            </AppText>
            <AppText variant="body">
              {t('requestedOn', { date: formatRentalDate(rental.createdAt) })}
            </AppText>
            <AppText variant="body">
              {t('startDate', { date: formatRentalDate(rental.startDate) })}
            </AppText>
            <AppText variant="body">
              {t('endDate', { date: formatRentalDate(rental.endDate) })}
            </AppText>
            {isFinished && rental.completedAt ? (
              <AppText variant="body">
                {t('completedDate', { date: formatRentalDate(rental.completedAt) })}
              </AppText>
            ) : null}

            {isFinished && ratings ? (
              <RateRentalCard rentalId={rentalId} perspective={perspective} ratings={ratings} />
            ) : null}

            {agreement ? (
              <AppButton
                title={t('viewAgreement')}
                variant="secondary"
                onPress={() =>
                  navigation.navigate('AgreementDetail', {
                    agreementId: agreement.id,
                    rentalId,
                    perspective,
                  })
                }
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
  actions: {
    gap: spacing.sm,
  },
});
