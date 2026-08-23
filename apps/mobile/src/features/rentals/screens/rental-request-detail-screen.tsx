import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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

type Props = NativeStackScreenProps<AppStackParamList, 'RentalRequestDetail'>;

export function RentalRequestDetailScreen({ navigation, route }: Props) {
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
        Alert.alert(
          'Request accepted',
          'You can now call the renter to arrange pickup. Start handover photos when you meet.',
        );
      },
      onError: (error) => Alert.alert('Accept failed', error.message),
    });
  };

  const handleReject = () => {
    Alert.alert('Reject request', 'Are you sure you want to reject this rental request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          rejectMutation.mutate(undefined, {
            onSuccess: () => {
              Alert.alert('Request rejected', 'The rental request has been rejected.');
            },
            onError: (error) => Alert.alert('Reject failed', error.message),
          });
        },
      },
    ]);
  };

  const handleCancel = () => {
    const title = isPending ? 'Cancel request' : 'Cancel rental';
    const message = isPending
      ? 'Are you sure you want to cancel this rental request?'
      : 'Are you sure you want to cancel this rental? The other party will no longer be able to continue.';

    Alert.alert(title, message, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: isPending ? 'Cancel request' : 'Cancel rental',
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(undefined, {
            onSuccess: () => {
              Alert.alert(
                isPending ? 'Request cancelled' : 'Rental cancelled',
                isPending
                  ? 'Your rental request has been cancelled.'
                  : 'This rental has been cancelled.',
              );
            },
            onError: (error) => Alert.alert('Cancel failed', error.message),
          });
        },
      },
    ]);
  };

  const handleApproveAgreement = () => {
    Alert.alert('Approve agreement', 'Confirm that you approve this rental agreement.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          approveAgreementMutation.mutate(undefined, {
            onSuccess: (updated) => {
              if (updated.status === 'APPROVED') {
                if (isOwnerView) {
                  Alert.alert(
                    'Agreement approved',
                    'Pickup is ready. Take photos of the vehicle condition next.',
                    [
                      {
                        text: 'Take pickup photos',
                        onPress: () => openPickupPhotos(navigation, 'owner'),
                      },
                      { text: 'Later', style: 'cancel' },
                    ],
                  );
                } else {
                  Alert.alert(
                    'Agreement approved',
                    'The owner will photograph the vehicle before pickup.',
                  );
                }
              } else {
                Alert.alert('Approval recorded', 'Waiting for the other party to approve.');
              }
            },
            onError: (error) => Alert.alert('Approval failed', error.message),
          });
        },
      },
    ]);
  };

  const handleComplete = () => {
    Alert.alert(
      'Complete rental',
      'Confirm that the vehicle has been returned and this rental should be marked complete.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete rental',
          onPress: () => {
            completeMutation.mutate(undefined, {
              onSuccess: () => {
                Alert.alert('Rental completed', 'You can now rate the renter. Tap the stars below.');
              },
              onError: (error) => Alert.alert('Completion failed', error.message),
            });
          },
        },
      ],
    );
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
            <PhotoCover photos={rental.vehicle.photos} emptyLabel="No vehicle photos" />
            <AppText variant="body">Status: {getRentalStatusLabel(rental.status)}</AppText>

            {nextStep ? <RentalNextStepCard step={nextStep} /> : null}

            <RentalRequestProfileCard
              label={isOwnerView ? 'Renter' : 'Owner'}
              profile={isOwnerView ? rental.renterProfile : rental.ownerProfile}
              phone={isOwnerView ? rental.contact?.renterPhone : rental.contact?.ownerPhone}
            />

            {isOwnerView && isPending ? (
              <View style={styles.actions}>
                <AppButton
                  title="Accept request"
                  loading={acceptMutation.isPending}
                  onPress={handleAccept}
                />
                <AppButton
                  title="Reject request"
                  variant="secondary"
                  loading={rejectMutation.isPending}
                  onPress={handleReject}
                />
              </View>
            ) : null}

            {!isOwnerView && isPending ? (
              <AppButton
                title="Cancel request"
                variant="secondary"
                loading={cancelMutation.isPending}
                onPress={handleCancel}
              />
            ) : null}

            {canCancelAfterAccept ? (
              <AppButton
                title="Cancel rental"
                variant="secondary"
                loading={cancelMutation.isPending}
                onPress={handleCancel}
              />
            ) : null}

            {isOwnerView && isAccepted && !agreement ? (
              <AppButton
                title="Create agreement"
                onPress={() => navigation.navigate('CreateAgreement', { rentalId })}
              />
            ) : null}

            {canApproveAgreement ? (
              <AppButton
                title="Approve agreement"
                loading={approveAgreementMutation.isPending}
                onPress={handleApproveAgreement}
              />
            ) : null}

            {isOwnerView && (isAccepted || isPickupPending) ? (
              <AppButton
                title="Start pickup handover"
                loading={isOpening}
                onPress={() => openPickupPhotos(navigation, 'owner')}
              />
            ) : null}

            {(isPickupApprovalPending || isActive || isFinished) && handover ? (
              <AppButton
                title={
                  isPickupApprovalPending && !isOwnerView
                    ? 'Review & approve pickup photos'
                    : 'View pickup photos'
                }
                onPress={() => openPickupPhotos(navigation, perspective)}
              />
            ) : null}

            {isActive && isOwnerView ? (
              <AppButton
                title="Complete rental"
                loading={completeMutation.isPending}
                onPress={handleComplete}
              />
            ) : null}

            <AppText variant="label">Details</AppText>
            <AppText variant="body">Color: {rental.vehicle.color}</AppText>
            {rental.vehicle.areaLabel ? (
              <AppText variant="body">Area: {rental.vehicle.areaLabel}</AppText>
            ) : null}
            <AppText variant="body">
              {isOwnerView ? 'Renter' : 'Owner'}:{' '}
              {isOwnerView ? rental.renter.fullName : rental.owner.fullName}
            </AppText>
            <AppText variant="body">Requested: {formatRentalDate(rental.createdAt)}</AppText>
            <AppText variant="body">Start date: {formatRentalDate(rental.startDate)}</AppText>
            <AppText variant="body">End date: {formatRentalDate(rental.endDate)}</AppText>
            {isFinished && rental.completedAt ? (
              <AppText variant="body">Completed: {formatRentalDate(rental.completedAt)}</AppText>
            ) : null}

            {isFinished && ratings ? (
              <RateRentalCard rentalId={rentalId} perspective={perspective} ratings={ratings} />
            ) : null}

            {agreement ? (
              <AppButton
                title="View full agreement"
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
  actions: {
    gap: spacing.sm,
  },
});
