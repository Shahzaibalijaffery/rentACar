import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/app-text';
import { colors, spacing } from '@/theme';

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <AppText variant="heading" style={styles.iconText}>
          ∅
        </AppText>
      </View>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="body" style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconText: {
    color: colors.textSecondary,
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
