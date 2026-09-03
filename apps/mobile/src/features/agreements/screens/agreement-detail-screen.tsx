import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
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
import { showAppAlert } from '@/stores/app-alert-store';

type Props = NativeStackScreenProps<AppStackParamList, 'AgreementDetail'>;

export function AgreementDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation('agreements');
  const { agreementId, rentalId, perspective: routePerspective } = route.params;
  const profileQuery = useProfileQuery();
  const agreementQuery = useAgreementQuery(agreementId);
  const approveMutation = useApproveAgreementMutation(agreementId, rentalId);
  const cancelMutation = useCancelAgreementMutation(agreementId, rentalId);

  const agreement = agreementQuery.data;
  const userId = profileQuery.data?.id;
  const perspective =
    routePerspective ??
    (agreement && userId ? (agreement.owner.id === userId ? 'owner' : 'renter') : 'renter');
  const isOwnerView = perspective === 'owner';
  const isPendingApproval = agreement?.status === 'PENDING_APPROVAL';
  const userAlreadyApproved =
    agreement && userId ? hasUserApprovedAgreement(agreement, userId) : false;
  const canApprove = isPendingApproval && !userAlreadyApproved;
  const canCancel = isPendingApproval;
  const isFullyApproved = agreement?.status === 'APPROVED';

  const { openPickupPhotos, isOpening } = useOpenPickupPhotos(rentalId, isFullyApproved);

  const handleApprove = () => {
    showAppAlert(t('approveTitle'), t('approveBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:approve'),
        onPress: () => {
          approveMutation.mutate(undefined, {
            onSuccess: (updated) => {
              if (updated.status === 'APPROVED') {
                if (isOwnerView) {
                  showAppAlert(t('approvedTitle'), t('approvedOwner'), [
                    {
                      text: t('takePhotos'),
                      onPress: () => openPickupPhotos(navigation, 'owner'),
                    },
                    { text: t('common:later'), style: 'cancel' },
                  ]);
                } else {
                  showAppAlert(t('approvedTitle'), t('approvedRenter'), [
                    { text: t('common:ok'), onPress: () => navigation.goBack() },
                  ]);
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

  const handleCancel = () => {
    showAppAlert(t('cancelTitle'), t('cancelBody'), [
      { text: t('keep'), style: 'cancel' },
      {
        text: t('cancelCta'),
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(undefined, {
            onSuccess: () => {
              showAppAlert(t('cancelledTitle'), t('cancelledBody'));
              navigation.goBack();
            },
            onError: (error) => showAppAlert(t('cancelFailed'), error.message),
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
            <AppText variant="title">{t('title')}</AppText>
            <AppText variant="body">
              {t('statusLabel', { status: getAgreementStatusLabel(agreement.status) })}
            </AppText>
            <AppText variant="body">{t('version', { version: agreement.version })}</AppText>

            <AppText variant="label">{t('vehicle')}</AppText>
            <AppText variant="body">
              {t('vehicleLine', {
                year: agreement.vehicle.year,
                make: agreement.vehicle.make,
                model: agreement.vehicle.model,
                color: agreement.vehicle.color,
              })}
            </AppText>

            <AppText variant="label">{t('period')}</AppText>
            <AppText variant="body">
              {t('start', { date: formatRentalDate(agreement.startDate) })}
            </AppText>
            <AppText variant="body">
              {t('end', { date: formatRentalDate(agreement.endDate) })}
            </AppText>

            <AppText variant="label">{t('common:owner')}</AppText>
            <AppText variant="body">{agreement.owner.fullName}</AppText>
            <AppText variant="body">{t('cnic', { cnic: agreement.owner.cnic })}</AppText>
            <AppText variant="caption">
              {t('ownerApproved', {
                value: agreement.ownerApprovedAt ? t('common:yes') : t('common:no'),
              })}
            </AppText>

            <AppText variant="label">{t('common:renter')}</AppText>
            <AppText variant="body">{agreement.renter.fullName}</AppText>
            <AppText variant="body">{t('cnic', { cnic: agreement.renter.cnic })}</AppText>
            <AppText variant="caption">
              {t('renterApproved', {
                value: agreement.renterApprovedAt ? t('common:yes') : t('common:no'),
              })}
            </AppText>

            <AppText variant="label">{t('terms')}</AppText>
            <AppText variant="body">{agreement.terms}</AppText>

            {canApprove ? (
              <AppButton
                title={t('approveCta')}
                loading={approveMutation.isPending}
                onPress={handleApprove}
              />
            ) : null}

            {userAlreadyApproved && isPendingApproval ? (
              <AppText variant="body">{t('waitingOther')}</AppText>
            ) : null}

            {isFullyApproved && isOwnerView ? (
              <>
                <AppText variant="body">{t('approvedOwnerHint')}</AppText>
                <AppButton
                  title={t('takePhotos')}
                  loading={isOpening}
                  onPress={() => openPickupPhotos(navigation, 'owner')}
                />
              </>
            ) : null}

            {isFullyApproved && !isOwnerView ? (
              <AppText variant="body">{t('approvedRenterHint')}</AppText>
            ) : null}

            {canCancel ? (
              <View style={styles.actions}>
                <AppButton
                  title={t('cancelCta')}
                  variant="secondary"
                  loading={cancelMutation.isPending}
                  onPress={handleCancel}
                />
              </View>
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
