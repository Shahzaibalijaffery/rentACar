import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import type { RentalNextStep } from '@/features/rentals/rental-utils';
import { colors, spacing } from '@/theme';

type Props = {
  step: RentalNextStep;
};

export function RentalNextStepCard({ step }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <AppIcon name="sparkle" size={14} color={colors.primary} />
        <AppText variant="label">Next step</AppText>
      </View>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
