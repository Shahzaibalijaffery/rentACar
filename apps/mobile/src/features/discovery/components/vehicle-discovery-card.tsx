import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { VehicleDiscoveryItem } from '@rentacar/shared';
import { AppText } from '@/components/app-text';
import { colors, spacing } from '@/theme';

type VehicleDiscoveryCardProps = {
  vehicle: VehicleDiscoveryItem;
  onPress: () => void;
};

export function VehicleDiscoveryCard({ vehicle, onPress }: VehicleDiscoveryCardProps) {
  const coverPhoto = vehicle.photos[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {coverPhoto ? (
        <Image source={{ uri: coverPhoto.url }} style={styles.photo} />
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
          {vehicle.color} · {vehicle.distanceLabel}
        </AppText>
        {vehicle.areaLabel ? (
          <AppText variant="caption" style={styles.meta}>
            Area: {vehicle.areaLabel}
          </AppText>
        ) : null}
        <AppText variant="caption" style={styles.owner}>
          Listed by {vehicle.owner.fullName}
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
    height: 160,
    backgroundColor: colors.background,
  },
  photoPlaceholder: {
    width: '100%',
    height: 160,
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
  owner: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
