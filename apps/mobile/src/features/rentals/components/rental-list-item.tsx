import { Pressable, StyleSheet } from 'react-native';
import type { RentalSummary } from '@rentacar/shared';
import { AppText } from '@/components/app-text';
import { StatusBadge } from '@/components/status-badge';
import { formatRentalDate, getRentalStatusLabel } from '@/features/rentals/rental-utils';
import { colors, radii, shadows, spacing } from '@/theme';

type RentalListItemProps = {
  rental: RentalSummary;
  perspective: 'renter' | 'owner';
  onPress: () => void;
};

export function RentalListItem({ rental, perspective, onPress }: RentalListItemProps) {
  const counterparty =
    perspective === 'renter'
      ? { label: 'Owner', name: rental.owner.fullName }
      : { label: 'Renter', name: rental.renter.fullName };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${rental.vehicle.make} ${rental.vehicle.model}, ${getRentalStatusLabel(rental.status)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <AppText variant="heading">
        {rental.vehicle.year} {rental.vehicle.make} {rental.vehicle.model}
      </AppText>
      <StatusBadge status={rental.status} />
      <AppText variant="body" style={styles.meta}>
        {counterparty.label}: {counterparty.name}
      </AppText>
      <AppText variant="caption" style={styles.meta}>
        Requested {formatRentalDate(rental.createdAt)}
      </AppText>
      {rental.completedAt ? (
        <AppText variant="caption" style={styles.meta}>
          Completed {formatRentalDate(rental.completedAt)}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.94,
  },
  meta: {
    color: colors.textSecondary,
  },
});
