import { I18nManager, StyleSheet, Text, TextProps } from 'react-native';
import { colors, typography } from '@/theme';

type AppTextProps = TextProps & {
  variant?: keyof typeof typography;
};

export function AppText({ variant = 'body', style, ...props }: AppTextProps) {
  return (
    <Text
      style={[
        styles.base,
        typography[variant],
        { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
});
