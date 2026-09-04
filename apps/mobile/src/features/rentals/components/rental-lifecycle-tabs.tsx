import { Pressable, StyleSheet, View } from 'react-native';
import type { RentalLifecycleFilter } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { colors, radii, spacing, useAppModeTheme } from '@/theme';

type RentalLifecycleTabsProps = {
  value: RentalLifecycleFilter;
  onChange: (value: RentalLifecycleFilter) => void;
};

const OPTIONS: { value: RentalLifecycleFilter; labelKey: 'all' | 'active' | 'completed'; icon: AppIconName }[] = [
  { value: 'all', labelKey: 'all', icon: 'list' },
  { value: 'active', labelKey: 'active', icon: 'clock' },
  { value: 'completed', labelKey: 'completed', icon: 'check' },
];

export function RentalLifecycleTabs({ value, onChange }: RentalLifecycleTabsProps) {
  const { t } = useTranslation('rentals');
  const theme = useAppModeTheme();

  return (
    <View style={[styles.track, { backgroundColor: theme.accentMuted }]}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.tab,
              selected ? { backgroundColor: theme.heroBg } : null,
            ]}
          >
            <View style={styles.tabInner}>
              <AppIcon
                name={option.icon}
                size={14}
                color={selected ? theme.heroText : colors.textSecondary}
              />
              <AppText
                variant="subtitle"
                style={selected ? { color: theme.heroText } : styles.tabText}
              >
                {t(`tabs.${option.labelKey}`)}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.full,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    color: colors.textSecondary,
  },
});
