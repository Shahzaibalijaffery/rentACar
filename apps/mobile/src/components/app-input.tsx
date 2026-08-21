import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

type AppInputProps = TextInputProps;

export function AppInput({ style, ...props }: AppInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      style={[styles.input, typography.body, style]}
      autoCapitalize="none"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 52,
  },
});
