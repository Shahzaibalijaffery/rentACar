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
import { useAgreementByRentalQuery } from '@/api/hooks/use-agreements';
import {
  useCreatePickupHandoverMutation,
  usePickupHandoverByRentalQuery,
} from '@/api/hooks/use-handovers';
import { formatRentalDate, getRentalStatusLabel } from '@/features/rentals/rental-utils';
import { CnicProfileLookup } from '@/features/users/components/cnic-profile-lookup';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'RentalRequestDetail'>;

export function RentalRequestDetailScreen({ navigation, route }: Props) {
  const { rentalId, perspective } = route.params;
  const rentalQuery = useRentalQuery(rentalId);
  const acceptMutation = useAcceptRentalMutation(rentalId);
  const rejectMutation = useRejectRentalMutation(rentalId);
  const cancelMutation = useCancelRentalMutation(rentalId);
  const completeMutation = useCompleteRentalMutation(rentalId);

  const rental = rentalQuery.data;
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
      (isAgreementPending || isPickupPending || isPickupApprovalPending || isActive || isCompleted),
    ),
  );

  const handoverQuery = usePickupHandoverByRentalQuery(
    rentalId,
    Boolean(rental && (isPickupPending || isPickupApprovalPending || isActive || isCompleted)),
  );

  const createHandoverMutation = useCreatePickupHandoverMutation(rentalId);

  const handleAccept = () => {
    acceptMutation.mutate(undefined, {
      onSuccess: () => {
        Alert.alert('Request accepted', 'The rental request has been accepted.');
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
        isLoading={rentalQuery.isLoading}
        isError={rentalQuery.isError}
        errorMessage={rentalQuery.error?.message}
      >
        {rental ? (
          <>
            <AppText variant="title">
              {rental.vehicle.year} {rental.vehicle.make} {rental.vehicle.model}
            </AppText>
            <AppText variant="body">Status: {getRentalStatusLabel(rental.status)}</AppText>
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

            {(isAgreementPending ||
              isPickupPending ||
              isPickupApprovalPending ||
              isActive ||
              isCompleted) &&
            agreementQuery.data ? (
              <AppButton
                title="View agreement"
                onPress={() =>
                  navigation.navigate('AgreementDetail', {
                    agreementId: agreementQuery.data.id,
                    rentalId,
                  })
                }
              />
            ) : null}

            {isAgreementPending && !agreementQuery.data && !agreementQuery.isLoading ? (
              <AppText variant="body">Agreement is being prepared.</AppText>
            ) : null}

            {isOwnerView && isPickupPending && !handoverQuery.data ? (
              <AppButton
                title="Start pickup handover"
                loading={createHandoverMutation.isPending}
                onPress={() => {
                  createHandoverMutation.mutate(undefined, {
                    onSuccess: (handover) => {
                      navigation.navigate('PickupHandover', {
                        handoverId: handover.id,
                        rentalId,
                        perspective: 'owner',
                      });
                    },
                    onError: (error) => Alert.alert('Could not start handover', error.message),
                  });
                }}
              />
            ) : null}

            {handoverQuery.data ? (
              <AppButton
                title="Open pickup handover"
                onPress={() =>
                  navigation.navigate('PickupHandover', {
                    handoverId: handoverQuery.data.id,
                    rentalId,
                    perspective: isOwnerView ? 'owner' : 'renter',
                  })
                }
              />
            ) : null}

            {isActive ? (
              <>
                <AppText variant="body">
                  This rental is active. Pickup photos remain the historical handover evidence.
                </AppText>
                <AppButton
                  title="Complete rental"
                  loading={completeMutation.isPending}
                  onPress={handleComplete}
                />
              </>
            ) : null}

            {isCompleted ? (
              <AppText variant="body">
                This rental is completed. Pickup handover evidence is preserved for your records.
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
  actions: {
    gap: spacing.sm,
  },
});
