import { StyleSheet, View } from 'react-native';
import type { RentalStatus } from '@rentacar/shared';
import { AppText } from '@/components/app-text';
import { getRentalStatusLabel } from '@/features/rentals/rental-utils';
import { colors, radii, spacing } from '@/theme';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger';

function getStatusTone(status: RentalStatus): StatusTone {
  switch (status) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'RATED':
      return 'success';
    case 'REJECTED':
    case 'CANCELLED':
      return 'danger';
    case 'PENDING':
    case 'ACCEPTED':
    case 'AGREEMENT_PENDING':
    case 'PICKUP_PENDING':
    case 'PICKUP_APPROVAL_PENDING':
    case 'RETURN_PENDING':
    case 'RETURN_APPROVAL_PENDING':
      return 'warning';
    default:
      return 'neutral';
  }
}

const toneStyles: Record<StatusTone, { bg: string; text: string }> = {
  neutral: { bg: colors.surfaceMuted, text: colors.textSecondary },
  success: { bg: colors.successMuted, text: colors.success },
  warning: { bg: colors.warningMuted, text: colors.warning },
  danger: { bg: colors.errorMuted, text: colors.error },
};

type StatusBadgeProps = {
  status: RentalStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = getStatusTone(status);
  const palette = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <AppText variant="label" style={[styles.label, { color: palette.text }]}>
        {getRentalStatusLabel(status)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
