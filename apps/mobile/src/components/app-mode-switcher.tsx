import { StyleSheet, View } from 'react-native';
import type { AppMode } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { useAppModeStore } from '@/stores/app-mode-store';
import { colors, spacing } from '@/theme';

const MODE_OPTIONS: { mode: AppMode; label: string; description: string }[] = [
  {
    mode: 'renter',
    label: 'Renter',
    description: 'Find and request vehicles to rent',
  },
  {
    mode: 'owner',
    label: 'Owner',
    description: 'Manage your vehicles and rental requests',
  },
];

type Props = {
  compact?: boolean;
};

export function AppModeSwitcher({ compact = false }: Props) {
  const activeMode = useAppModeStore((state) => state.activeMode);
  const setActiveMode = useAppModeStore((state) => state.setActiveMode);
  const activeDescription =
    MODE_OPTIONS.find((option) => option.mode === activeMode)?.description ?? '';

  return (
    <View style={styles.container}>
      {!compact ? <AppText variant="label">Active profile</AppText> : null}
      <View style={styles.row}>
        {MODE_OPTIONS.map((option) => (
          <AppButton
            key={option.mode}
            title={option.label}
            variant={activeMode === option.mode ? 'primary' : 'secondary'}
            onPress={() => setActiveMode(option.mode)}
            style={styles.modeButton}
          />
        ))}
      </View>
      {!compact ? (
        <AppText variant="caption" style={styles.description}>
          {activeDescription}
        </AppText>
      ) : null}
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
  modeButton: {
    flex: 1,
  },
  description: {
    color: colors.textSecondary,
  },
});
