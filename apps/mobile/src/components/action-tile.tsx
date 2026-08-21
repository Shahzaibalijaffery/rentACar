import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/app-text';
import { colors, radii, shadows, spacing } from '@/theme';

type ActionTileProps = {
  title: string;
  description: string;
  accent?: string;
  onPress: () => void;
};

export function ActionTile({ title, description, accent = colors.primary, onPress }: ActionTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
    >
      <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}>
        <View style={[styles.iconDot, { backgroundColor: accent }]} />
      </View>
      <View style={styles.copy}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText variant="caption" style={styles.description}>
          {description}
        </AppText>
      </View>
      <AppText variant="caption" style={styles.chevron}>
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  description: {
    color: colors.textSecondary,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 22,
    lineHeight: 24,
  },
});
