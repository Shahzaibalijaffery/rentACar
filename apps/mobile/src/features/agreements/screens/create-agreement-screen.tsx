import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { useCreateAgreementMutation } from '@/api/hooks/use-agreements';
import { DEFAULT_AGREEMENT_TERMS } from '@/features/agreements/agreement-utils';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { useState } from 'react';
import { showAppAlert } from '@/stores/app-alert-store';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateAgreement'>;

export function CreateAgreementScreen({ navigation, route }: Props) {
  const { t } = useTranslation('agreements');
  const { rentalId } = route.params;
  const createMutation = useCreateAgreementMutation(rentalId);
  const [terms, setTerms] = useState(DEFAULT_AGREEMENT_TERMS);

  const handleCreate = () => {
    if (terms.trim().length < 10) {
      showAppAlert(t('termsRequired'), t('termsRequiredBody'));
      return;
    }

    createMutation.mutate(
      { terms: terms.trim() },
      {
        onSuccess: () => {
          showAppAlert(t('createdTitle'), t('createdBody'), [
            {
              text: t('backToRental'),
              onPress: () =>
                navigation.navigate('RentalRequestDetail', { rentalId, perspective: 'owner' }),
            },
          ]);
        },
        onError: (error) => showAppAlert(t('createFailed'), error.message),
      },
    );
  };

  return (
    <KeyboardAwareScroll contentContainerStyle={styles.container}>
      <AppText variant="title">{t('createTitle')}</AppText>
      <AppText variant="body">{t('createHint')}</AppText>

      <AppText variant="label">{t('termsLabel')}</AppText>
      <AppInput
        value={terms}
        onChangeText={setTerms}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        style={styles.termsInput}
      />

      <AppButton
        title={t('createCta')}
        loading={createMutation.isPending}
        onPress={handleCreate}
      />
      <AppButton title={t('common:back')} variant="secondary" onPress={() => navigation.goBack()} />
    </KeyboardAwareScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  termsInput: {
    minHeight: 160,
  },
});
