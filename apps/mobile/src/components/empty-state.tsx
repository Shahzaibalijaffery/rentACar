import { StyleSheet, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { colors, spacing } from '@/theme';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: AppIconName;
};

export function EmptyState({ title, message, icon = 'car' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <AppIcon name={icon} size={26} color={colors.primary} />
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
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
