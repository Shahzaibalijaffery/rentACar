import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/app-text';
import type { RentalNextStep } from '@/features/rentals/rental-utils';
import { colors, spacing } from '@/theme';

type Props = {
  step: RentalNextStep;
};

export function RentalNextStepCard({ step }: Props) {
  return (
    <View style={styles.card}>
      <AppText variant="label">Next step</AppText>
      <AppText variant="title">{step.title}</AppText>
      <AppText variant="body">{step.description}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
});
