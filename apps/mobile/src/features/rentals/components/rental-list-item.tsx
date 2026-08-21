import { Pressable, StyleSheet } from 'react-native';
import type { RentalSummary } from '@rentacar/shared';
import { AppText } from '@/components/app-text';
import { formatRentalDate, getRentalStatusLabel } from '@/features/rentals/rental-utils';
import { colors, radii, spacing } from '@/theme';

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
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <AppText variant="heading">
        {rental.vehicle.year} {rental.vehicle.make} {rental.vehicle.model}
      </AppText>
      <AppText variant="body">Status: {getRentalStatusLabel(rental.status)}</AppText>
      <AppText variant="body">
        {counterparty.label}: {counterparty.name}
      </AppText>
      <AppText variant="caption">Requested: {formatRentalDate(rental.createdAt)}</AppText>
      {rental.completedAt ? (
        <AppText variant="caption">Completed: {formatRentalDate(rental.completedAt)}</AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.9,
  },
});
