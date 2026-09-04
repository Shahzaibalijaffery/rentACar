import { StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { spacing, colors, useAppModeTheme } from '@/theme';
import { useAuthStore } from '@/stores/auth-store';

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
  const keyboardHeight = useKeyboardHeight();
  const accessToken = useAuthStore((state) => state.accessToken);
  const { canvas } = useAppModeTheme();
  const paddingStyle = padded ? styles.padded : undefined;
  const bottomEdges = keyboardHeight > 0 ? [] : (['bottom'] as const);
  const canvasStyle = { backgroundColor: accessToken ? canvas : colors.background };

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safe, canvasStyle]} edges={bottomEdges}>
        <View style={[styles.content, paddingStyle, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, canvasStyle]} edges={bottomEdges}>
      <KeyboardAwareScroll
        contentContainerStyle={[styles.scrollContent, paddingStyle, contentStyle]}
        style={style}
        {...scrollProps}
      >
        {children}
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.md,
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
