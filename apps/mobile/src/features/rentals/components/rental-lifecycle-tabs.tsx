import { Pressable, StyleSheet, View } from 'react-native';
import type { RentalLifecycleFilter } from '@rentacar/shared';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { colors, radii, spacing } from '@/theme';

type RentalLifecycleTabsProps = {
  value: RentalLifecycleFilter;
  onChange: (value: RentalLifecycleFilter) => void;
};

const OPTIONS: { value: RentalLifecycleFilter; label: string; icon: AppIconName }[] = [
  { value: 'all', label: 'All', icon: 'list' },
  { value: 'active', label: 'Active', icon: 'clock' },
  { value: 'completed', label: 'Completed', icon: 'check' },
];

export function RentalLifecycleTabs({ value, onChange }: RentalLifecycleTabsProps) {
  return (
    <View style={styles.track}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.tab, selected ? styles.tabSelected : null]}
          >
            <View style={styles.tabInner}>
              <AppIcon
                name={option.icon}
                size={14}
                color={selected ? colors.primary : colors.textSecondary}
              />
              <AppText variant="subtitle" style={selected ? styles.tabTextSelected : styles.tabText}>
                {option.label}
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
  tabSelected: {
    backgroundColor: colors.surface,
  },
  tabText: {
    color: colors.textSecondary,
  },
  tabTextSelected: {
    color: colors.primary,
  },
});
