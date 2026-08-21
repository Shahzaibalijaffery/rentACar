import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { VehiclePublicView } from '@rentacar/shared';
import { AppText } from '@/components/app-text';
import { colors, spacing } from '@/theme';

type ProfileVehicleCardProps = {
  vehicle: VehiclePublicView;
  onPress: () => void;
};

export function ProfileVehicleCard({ vehicle, onPress }: ProfileVehicleCardProps) {
  const coverPhoto = vehicle.photos[0];
  const isRequestable = vehicle.availability === 'AVAILABLE';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {coverPhoto ? (
        <View>
          <Image source={{ uri: coverPhoto.url }} style={styles.photo} />
          <View style={styles.badge}>
            <AppText variant="caption" style={styles.badgeText}>
              {vehicle.photos.length === 1 ? '1 photo' : `${vehicle.photos.length} photos`}
            </AppText>
          </View>
        </View>
      ) : (
        <View style={styles.photoPlaceholder}>
          <AppText variant="caption">No photo</AppText>
        </View>
      )}

      <View style={styles.content}>
        <AppText variant="body" style={styles.title}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </AppText>
        <AppText variant="caption" style={styles.meta}>
          {vehicle.color} · {vehicle.availability === 'AVAILABLE' ? 'Available' : 'Unavailable'}
        </AppText>
        {vehicle.areaLabel ? (
          <AppText variant="caption" style={styles.meta}>
            Area: {vehicle.areaLabel}
          </AppText>
        ) : null}
        <AppText variant="caption" style={styles.action}>
          {isRequestable ? 'Tap to view and request rental' : 'Not available for requests'}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  photo: {
    width: '100%',
    height: 140,
    backgroundColor: colors.background,
  },
  badge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.textOnPrimary,
  },
  photoPlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontWeight: '600',
  },
  meta: {
    color: colors.textSecondary,
  },
  action: {
    color: colors.primary,
    marginTop: spacing.xs,
  },
});
