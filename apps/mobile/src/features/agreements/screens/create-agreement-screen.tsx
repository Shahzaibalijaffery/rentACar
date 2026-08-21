import { Alert, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { useCreateAgreementMutation } from '@/api/hooks/use-agreements';
import { DEFAULT_AGREEMENT_TERMS } from '@/features/agreements/agreement-utils';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { useState } from 'react';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateAgreement'>;

export function CreateAgreementScreen({ navigation, route }: Props) {
  const { rentalId } = route.params;
  const createMutation = useCreateAgreementMutation(rentalId);
  const [terms, setTerms] = useState(DEFAULT_AGREEMENT_TERMS);

  const handleCreate = () => {
    if (terms.trim().length < 10) {
      Alert.alert('Terms required', 'Please provide agreement terms.');
      return;
    }

    createMutation.mutate(
      { terms: terms.trim() },
      {
        onSuccess: (agreement) => {
          Alert.alert('Agreement created', 'The renter can now review and approve the agreement.', [
            {
              text: 'View agreement',
              onPress: () =>
                navigation.replace('AgreementDetail', {
                  agreementId: agreement.id,
                  rentalId,
                }),
            },
          ]);
        },
        onError: (error) => Alert.alert('Create failed', error.message),
      },
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText variant="title">Create rental agreement</AppText>
      <AppText variant="body">
        Define the terms for this rental. Both you and the renter must approve before pickup can
        begin.
      </AppText>

      <AppText variant="label">Agreement terms</AppText>
      <AppInput
        value={terms}
        onChangeText={setTerms}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        style={styles.termsInput}
      />

      <AppButton
        title="Create agreement"
        loading={createMutation.isPending}
        onPress={handleCreate}
      />
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
  termsInput: {
    minHeight: 160,
  },
});
