import { StyleSheet, View } from 'react-native';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { spacing, colors } from '@/theme';
import type { ComponentProps } from 'react';

type FormFieldProps = ComponentProps<typeof AppInput> & {
  label: string;
  hint?: string;
};

export function FormField({ label, hint, ...inputProps }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <AppInput {...inputProps} />
      {hint ? (
        <AppText variant="caption" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  hint: {
    color: colors.textSecondary,
  },
});
