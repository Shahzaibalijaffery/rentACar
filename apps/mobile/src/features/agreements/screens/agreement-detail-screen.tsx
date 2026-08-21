import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { QueryState } from '@/components/query-state';
import {
  useAgreementQuery,
  useApproveAgreementMutation,
  useCancelAgreementMutation,
} from '@/api/hooks/use-agreements';
import { useProfileQuery } from '@/api/hooks/use-auth';
import {
  getAgreementStatusLabel,
  hasUserApprovedAgreement,
} from '@/features/agreements/agreement-utils';
import { useOpenPickupPhotos } from '@/features/handovers/use-open-pickup-photos';
import { formatRentalDate } from '@/features/rentals/rental-utils';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'AgreementDetail'>;

export function AgreementDetailScreen({ navigation, route }: Props) {
  const { agreementId, rentalId, perspective: routePerspective } = route.params;
  const profileQuery = useProfileQuery();
  const agreementQuery = useAgreementQuery(agreementId);
  const approveMutation = useApproveAgreementMutation(agreementId, rentalId);
  const cancelMutation = useCancelAgreementMutation(agreementId, rentalId);

  const agreement = agreementQuery.data;
  const userId = profileQuery.data?.id;
  const perspective =
    routePerspective ??
    (agreement && userId
      ? agreement.owner.id === userId
        ? 'owner'
        : 'renter'
      : 'renter');
  const isOwnerView = perspective === 'owner';
  const isPendingApproval = agreement?.status === 'PENDING_APPROVAL';
  const userAlreadyApproved =
    agreement && userId ? hasUserApprovedAgreement(agreement, userId) : false;
  const canApprove = isPendingApproval && !userAlreadyApproved;
  const canCancel = isPendingApproval;
  const isFullyApproved = agreement?.status === 'APPROVED';

  const { openPickupPhotos, isOpening } = useOpenPickupPhotos(rentalId, isFullyApproved);

  const handleApprove = () => {
    Alert.alert('Approve agreement', 'Confirm that you approve this rental agreement.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          approveMutation.mutate(undefined, {
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
                    [{ text: 'OK', onPress: () => navigation.goBack() }],
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

  const handleCancel = () => {
    Alert.alert('Cancel agreement', 'Are you sure you want to cancel this agreement?', [
      { text: 'Keep agreement', style: 'cancel' },
      {
        text: 'Cancel agreement',
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(undefined, {
            onSuccess: () => {
              Alert.alert('Agreement cancelled', 'The agreement has been cancelled.');
              navigation.goBack();
            },
            onError: (error) => Alert.alert('Cancel failed', error.message),
          });
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <QueryState
        isLoading={agreementQuery.isLoading || profileQuery.isLoading}
        isError={agreementQuery.isError}
        errorMessage={agreementQuery.error?.message}
      >
        {agreement ? (
          <>
            <AppText variant="title">Rental agreement</AppText>
            <AppText variant="body">Status: {getAgreementStatusLabel(agreement.status)}</AppText>
            <AppText variant="body">Version: {agreement.version}</AppText>

            <AppText variant="label">Vehicle</AppText>
            <AppText variant="body">
              {agreement.vehicle.year} {agreement.vehicle.make} {agreement.vehicle.model} (
              {agreement.vehicle.color})
            </AppText>

            <AppText variant="label">Rental period</AppText>
            <AppText variant="body">Start: {formatRentalDate(agreement.startDate)}</AppText>
            <AppText variant="body">End: {formatRentalDate(agreement.endDate)}</AppText>

            <AppText variant="label">Owner</AppText>
            <AppText variant="body">{agreement.owner.fullName}</AppText>
            <AppText variant="body">CNIC: {agreement.owner.cnic}</AppText>
            <AppText variant="caption">
              Owner approved: {agreement.ownerApprovedAt ? 'Yes' : 'No'}
            </AppText>

            <AppText variant="label">Renter</AppText>
            <AppText variant="body">{agreement.renter.fullName}</AppText>
            <AppText variant="body">CNIC: {agreement.renter.cnic}</AppText>
            <AppText variant="caption">
              Renter approved: {agreement.renterApprovedAt ? 'Yes' : 'No'}
            </AppText>

            <AppText variant="label">Terms</AppText>
            <AppText variant="body">{agreement.terms}</AppText>

            {canApprove ? (
              <AppButton
                title="Approve agreement"
                loading={approveMutation.isPending}
                onPress={handleApprove}
              />
            ) : null}

            {userAlreadyApproved && isPendingApproval ? (
              <AppText variant="body">You have approved. Waiting for the other party.</AppText>
            ) : null}

            {isFullyApproved && isOwnerView ? (
              <>
                <AppText variant="body">
                  Agreement is approved. Take photos of the vehicle before handover.
                </AppText>
                <AppButton
                  title="Take pickup photos"
                  loading={isOpening}
                  onPress={() => openPickupPhotos(navigation, 'owner')}
                />
              </>
            ) : null}

            {isFullyApproved && !isOwnerView ? (
              <AppText variant="body">
                Agreement is approved. Waiting for the owner to take pickup photos.
              </AppText>
            ) : null}

            {canCancel ? (
              <View style={styles.actions}>
                <AppButton
                  title="Cancel agreement"
                  variant="secondary"
                  loading={cancelMutation.isPending}
                  onPress={handleCancel}
                />
              </View>
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
