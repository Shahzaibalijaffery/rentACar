import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { colors, radii, shadows, spacing } from '@/theme';

type ActionTileProps = {
  title: string;
  description: string;
  icon: AppIconName;
  accent?: string;
  iconBackground?: string;
  onPress: () => void;
};

export function ActionTile({
  title,
  description,
  icon,
  accent = colors.primary,
  iconBackground = colors.primaryMuted,
  onPress,
}: ActionTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
    >
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        <AppIcon name={icon} size={22} color={accent} />
      </View>
      <View style={styles.copy}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText variant="caption" style={styles.description}>
          {description}
        </AppText>
      </View>
      <AppIcon name="chevron-right" size={18} color={colors.textSecondary} />
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
  copy: {
    flex: 1,
    gap: 2,
  },
  description: {
    color: colors.textSecondary,
  },
});
