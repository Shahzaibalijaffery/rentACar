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
import {
  formatRentalDate,
  getRentalNextStep,
  getRentalStatusLabel,
} from '@/features/rentals/rental-utils';
import { CnicProfileLookup } from '@/features/users/components/cnic-profile-lookup';
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
  const isOwnerView = perspective === 'owner';

  const agreementQuery = useAgreementByRentalQuery(
    rentalId,
    Boolean(
      rental &&
      (isAccepted ||
        isAgreementPending ||
        isPickupPending ||
        isPickupApprovalPending ||
        isActive ||
        isCompleted ||
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
    Boolean(rental && (isPickupPending || isPickupApprovalPending || isActive || isCompleted)),
  );

  const nextStep = rental
    ? getRentalNextStep({
        status: rental.status,
        perspective,
        hasAgreement: Boolean(agreement),
        userApprovedAgreement,
        agreementFullyApproved: agreement?.status === 'APPROVED',
        handoverStatus: handover?.status,
      })
    : null;

  const handleAccept = () => {
    acceptMutation.mutate(undefined, {
      onSuccess: (accepted) => {
        Alert.alert(
          'Request accepted',
          'Rental terms are confirmed. Photograph the vehicle before handover.',
          [
            {
              text: 'Take pickup photos',
              onPress: () => {
                if (accepted.pickupHandoverId) {
                  navigation.navigate('PickupHandover', {
                    handoverId: accepted.pickupHandoverId,
                    rentalId,
                    perspective: 'owner',
                  });
                  return;
                }
                openPickupPhotos(navigation, 'owner');
              },
            },
            { text: 'Later', style: 'cancel' },
          ],
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
    Alert.alert('Cancel request', 'Are you sure you want to cancel this rental request?', [
      { text: 'Keep request', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(undefined, {
            onSuccess: () => {
              Alert.alert('Request cancelled', 'Your rental request has been cancelled.');
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
                Alert.alert('Rental completed', 'This rental has been marked as completed.');
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
            <AppText variant="body">Status: {getRentalStatusLabel(rental.status)}</AppText>

            {nextStep ? <RentalNextStepCard step={nextStep} /> : null}

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

            {isOwnerView && isAccepted ? (
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

            {isOwnerView && isPickupPending ? (
              <AppButton
                title="Take pickup photos"
                loading={isOpening}
                onPress={() => openPickupPhotos(navigation, 'owner')}
              />
            ) : null}

            {(isPickupApprovalPending || isActive || isCompleted) && handover ? (
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
            {isCompleted && rental.completedAt ? (
              <AppText variant="body">Completed: {formatRentalDate(rental.completedAt)}</AppText>
            ) : null}

            {rental.status !== 'REJECTED' && rental.status !== 'CANCELLED' ? (
              <CnicProfileLookup participantLabel={isOwnerView ? 'renter' : 'owner'} />
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
