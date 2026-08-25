import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AppMode } from '@rentacar/shared';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { useAppModeStore } from '@/stores/app-mode-store';
import { colors, radii, spacing } from '@/theme';

const MODE_OPTIONS: { mode: AppMode; labelKey: 'renter' | 'owner'; icon: AppIconName }[] = [
  { mode: 'renter', labelKey: 'renter', icon: 'user' },
  { mode: 'owner', labelKey: 'owner', icon: 'car' },
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
      {!compact ? <AppText variant="label">{t('home:activeProfile')}</AppText> : null}
      <View style={styles.track}>
        {MODE_OPTIONS.map((option) => {
          const selected = activeMode === option.mode;
          return (
            <Pressable
              key={option.mode}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setActiveMode(option.mode)}
              style={[styles.segment, selected ? styles.segmentSelected : null]}
            >
              <View style={styles.segmentInner}>
                <AppIcon
                  name={option.icon}
                  size={16}
                  color={selected ? colors.textOnPrimary : colors.textSecondary}
                />
                <AppText
                  variant="subtitle"
                  style={[styles.segmentText, selected ? styles.segmentTextSelected : null]}
                >
                  {t(option.labelKey)}
                </AppText>
              </View>
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
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.full,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  segmentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.textOnPrimary,
  },
});
