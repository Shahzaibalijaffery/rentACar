import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { VehicleDiscoveryItem } from '@rentacar/shared';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { RatingSummaryText } from '@/features/ratings/components/rating-summary-text';
import { colors, radii, shadows, spacing } from '@/theme';

type VehicleDiscoveryCardProps = {
  vehicle: VehicleDiscoveryItem;
  onPress: () => void;
};

export function VehicleDiscoveryCard({ vehicle, onPress }: VehicleDiscoveryCardProps) {
  const coverPhoto = vehicle.photos[0];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      onPress={onPress}
    >
      {coverPhoto ? (
        <View>
          <Image source={{ uri: coverPhoto.url }} style={styles.photo} />
          {vehicle.photos.length > 0 ? (
            <View style={styles.badge}>
              <AppIcon name="camera" size={12} color={colors.textOnPrimary} />
              <AppText variant="caption" style={styles.badgeText}>
                {vehicle.photos.length === 1 ? '1 photo' : `${vehicle.photos.length} photos`}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.photoPlaceholder}>
          <AppIcon name="camera" size={28} color={colors.textSecondary} />
          <AppText variant="caption" style={styles.placeholderText}>
            No photo
          </AppText>
        </View>
      )}

      <View style={styles.content}>
        <AppText variant="heading">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </AppText>
        <AppText variant="caption" style={styles.meta}>
          {vehicle.color} · {vehicle.distanceLabel}
        </AppText>
        <RatingSummaryText summary={vehicle.rating} />
        {vehicle.areaLabel ? (
          <View style={styles.metaRow}>
            <AppIcon name="pin" size={13} color={colors.textSecondary} />
            <AppText variant="caption" style={styles.meta}>
              {vehicle.areaLabel}
            </AppText>
          </View>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <AppIcon name="user" size={13} color={colors.textSecondary} />
            <AppText variant="caption" style={styles.owner}>
              {vehicle.owner.fullName}
            </AppText>
          </View>
          <AppText variant="caption" style={styles.cta}>
            View details
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  pressed: {
    opacity: 0.96,
  },
  photo: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surfaceMuted,
  },
  badge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(28, 22, 18, 0.72)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.textOnPrimary,
  },
  photoPlaceholder: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  meta: {
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  owner: {
    color: colors.textSecondary,
  },
  cta: {
    color: colors.primary,
    fontWeight: '600',
  },
});
