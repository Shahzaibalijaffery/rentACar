import { Pressable, StyleSheet, View } from 'react-native';
import type { RentalSummary } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/app-icon';
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
  const { t } = useTranslation('rentals');
  const role = perspective === 'renter' ? t('common:owner') : t('common:renter');
  const name = perspective === 'renter' ? rental.owner.fullName : rental.renter.fullName;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${rental.vehicle.make} ${rental.vehicle.model}, ${getRentalStatusLabel(rental.status)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.titleRow}>
        <AppIcon name="car" size={18} color={colors.primary} />
        <AppText variant="heading" style={styles.title}>
          {rental.vehicle.year} {rental.vehicle.make} {rental.vehicle.model}
        </AppText>
      </View>
      <StatusBadge status={rental.status} />
      <View style={styles.metaRow}>
        <AppIcon name="user" size={14} color={colors.textSecondary} />
        <AppText variant="body" style={styles.meta}>
          {t('counterparty', { role, name })}
        </AppText>
      </View>
      <View style={styles.metaRow}>
        <AppIcon name="clock" size={14} color={colors.textSecondary} />
        <AppText variant="caption" style={styles.meta}>
          {t('requested', { date: formatRentalDate(rental.createdAt) })}
        </AppText>
      </View>
      {rental.completedAt ? (
        <View style={styles.metaRow}>
          <AppIcon name="check" size={14} color={colors.textSecondary} />
          <AppText variant="caption" style={styles.meta}>
            {t('completedOn', { date: formatRentalDate(rental.completedAt) })}
          </AppText>
        </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    color: colors.textSecondary,
    flex: 1,
  },
});
