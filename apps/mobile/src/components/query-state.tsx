import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/app-text';
import { colors, spacing } from '@/theme';

type QueryStateProps = {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  children: React.ReactNode;
};

export function QueryState({ isLoading, isError, errorMessage, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <AppText variant="body">{errorMessage ?? 'Something went wrong.'}</AppText>
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
    padding: spacing.lg,
  },
});
