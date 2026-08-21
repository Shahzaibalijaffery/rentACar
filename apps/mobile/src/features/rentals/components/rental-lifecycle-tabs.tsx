import { Pressable, StyleSheet, View } from 'react-native';
import type { RentalLifecycleFilter } from '@rentacar/shared';
import { AppText } from '@/components/app-text';
import { colors, radii, spacing } from '@/theme';

type RentalLifecycleTabsProps = {
  value: RentalLifecycleFilter;
  onChange: (value: RentalLifecycleFilter) => void;
};

const OPTIONS: { value: RentalLifecycleFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export function RentalLifecycleTabs({ value, onChange }: RentalLifecycleTabsProps) {
  return (
    <View style={styles.row}>
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
            <AppText variant="body">{option.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  tabSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
});
