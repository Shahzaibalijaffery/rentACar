import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radii, shadows, spacing } from '@/theme';

type AppCardProps = ViewProps & {
  children: React.ReactNode;
  muted?: boolean;
};

export function AppCard({ children, muted = false, style, ...props }: AppCardProps) {
  return (
    <View style={[styles.card, muted ? styles.muted : null, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    ...shadows.sm,
  },
});
