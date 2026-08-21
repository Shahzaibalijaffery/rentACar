import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { VehicleDiscoveryItem } from '@rentacar/shared';
import { AppText } from '@/components/app-text';
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
        <Image source={{ uri: coverPhoto.url }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
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
        {vehicle.areaLabel ? (
          <AppText variant="caption" style={styles.meta}>
            {vehicle.areaLabel}
          </AppText>
        ) : null}
        <View style={styles.footer}>
          <AppText variant="caption" style={styles.owner}>
            {vehicle.owner.fullName}
          </AppText>
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
  photoPlaceholder: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
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
