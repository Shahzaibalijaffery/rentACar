import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AppMode } from '@rentacar/shared';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { useAppModeStore } from '@/stores/app-mode-store';
import { appModeThemes, colors, radii, shadows, spacing } from '@/theme';

const MODE_OPTIONS: {
  mode: AppMode;
  labelKey: 'renter' | 'owner';
  hintKey: 'renterSwitchHint' | 'ownerSwitchHint';
  icon: AppIconName;
}[] = [
  { mode: 'renter', labelKey: 'renter', hintKey: 'renterSwitchHint', icon: 'compass' },
  { mode: 'owner', labelKey: 'owner', hintKey: 'ownerSwitchHint', icon: 'car' },
];

type Props = {
  compact?: boolean;
};

export function AppModeSwitcher({ compact = false }: Props) {
  const { t } = useTranslation();
  const activeMode = useAppModeStore((state) => state.activeMode);
  const setActiveMode = useAppModeStore((state) => state.setActiveMode);

  return (
    <View style={styles.container}>
      {!compact ? <AppText variant="label">{t('home:yourProfiles')}</AppText> : null}
      <View style={styles.row}>
        {MODE_OPTIONS.map((option) => {
          const selected = activeMode === option.mode;
          const theme = appModeThemes[option.mode];
          return (
            <Pressable
              key={option.mode}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setActiveMode(option.mode)}
              style={({ pressed }) => [
                styles.card,
                selected
                  ? { backgroundColor: theme.heroBg, borderColor: theme.heroBg }
                  : styles.cardIdle,
                pressed ? styles.pressed : null,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: selected ? theme.heroBadgeBg : theme.accentMuted,
                  },
                ]}
              >
                <AppIcon
                  name={option.icon}
                  size={20}
                  color={selected ? theme.heroText : theme.accent}
                />
              </View>
              <AppText
                variant="subtitle"
                style={[styles.name, { color: selected ? theme.heroText : colors.text }]}
              >
                {t(option.labelKey)}
              </AppText>
              {compact ? null : (
                <AppText
                  variant="caption"
                  style={{ color: selected ? theme.heroMuted : colors.textSecondary }}
                >
                  {t(`home:${option.hintKey}`)}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
});
