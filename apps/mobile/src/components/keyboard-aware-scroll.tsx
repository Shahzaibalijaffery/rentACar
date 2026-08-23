import { useEffect, useRef, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  StyleSheet,
} from 'react-native';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { spacing } from '@/theme';

type KeyboardAwareScrollProps = ScrollViewProps & {
  children: React.ReactNode;
};

export function KeyboardAwareScroll({
  children,
  contentContainerStyle,
  style,
  onScroll,
  ...scrollProps
}: KeyboardAwareScrollProps) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(0);
  const keyboardHeight = useKeyboardHeight();
  const { height: windowHeight } = useWindowDimensions();
  const androidInset = Platform.OS === 'android' ? keyboardHeight : 0;

  useEffect(() => {
    if (keyboardHeight === 0) {
      return;
    }

    const timer = setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput();
      if (!input) {
        return;
      }

      input.measureInWindow((_x, y, _width, height) => {
        const visibleBottom = windowHeight - keyboardHeight - spacing.lg;
        const overlap = y + height - visibleBottom;
        if (overlap > 0) {
          scrollRef.current?.scrollTo({
            y: Math.max(0, scrollY.current + overlap),
            animated: true,
          });
        }
      });
    }, 60);

    return () => clearTimeout(timer);
  }, [keyboardHeight, windowHeight]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
        contentContainerStyle={[
          styles.content,
          contentContainerStyle,
          { paddingBottom: spacing.xl + androidInset },
        ]}
        style={[styles.flex, style]}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
