import { ScrollView, ScrollViewProps, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

type ScreenLayoutProps = ScrollViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  padded?: boolean;
};

export function ScreenLayout({
  children,
  scroll = true,
  contentStyle,
  padded = true,
  style,
  ...scrollProps
}: ScreenLayoutProps) {
  const paddingStyle = padded ? styles.padded : undefined;

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={[styles.content, paddingStyle, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, paddingStyle, contentStyle]}
        style={[styles.scroll, style]}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
    gap: spacing.md,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
