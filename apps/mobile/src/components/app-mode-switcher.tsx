import { StyleSheet, View } from 'react-native';
import type { AppMode } from '@rentacar/shared';
import { Pressable } from 'react-native';
import { AppText } from '@/components/app-text';
import { useAppModeStore } from '@/stores/app-mode-store';
import { colors, radii, spacing } from '@/theme';

const MODE_OPTIONS: { mode: AppMode; label: string }[] = [
  { mode: 'renter', label: 'Renter' },
  { mode: 'owner', label: 'Owner' },
];

type Props = {
  compact?: boolean;
};

export function AppModeSwitcher({ compact = false }: Props) {
  const activeMode = useAppModeStore((state) => state.activeMode);
  const setActiveMode = useAppModeStore((state) => state.setActiveMode);

  return (
    <View style={styles.container}>
      {!compact ? <AppText variant="label">Active profile</AppText> : null}
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
              <AppText
                variant="subtitle"
                style={[styles.segmentText, selected ? styles.segmentTextSelected : null]}
              >
                {option.label}
              </AppText>
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
  segmentSelected: {
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.primary,
  },
});
