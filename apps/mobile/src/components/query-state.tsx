import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { colors, radii, spacing } from '@/theme';

type QueryStateProps = {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  children: React.ReactNode;
};

export function QueryState({ isLoading, isError, errorMessage, children }: QueryStateProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <AppText variant="caption" style={styles.loadingText}>
          {t('loading')}
        </AppText>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorBox}>
        <AppIcon name="alert" size={22} color={colors.error} />
        <AppText variant="heading" style={styles.errorTitle}>
          {t('somethingWentWrong')}
        </AppText>
        <AppText variant="body" style={styles.errorMessage}>
          {errorMessage ?? t('tryAgain')}
        </AppText>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  errorBox: {
    backgroundColor: colors.errorMuted,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  errorTitle: {
    color: colors.error,
  },
  errorMessage: {
    color: colors.textSecondary,
  },
});
