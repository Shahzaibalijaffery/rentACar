import { ActivityIndicator, Pressable, PressableProps, StyleSheet } from 'react-native';
import { AppText } from '@/components/app-text';
import { colors, radii, spacing } from '@/theme';

type AppButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function AppButton({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled ?? loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.background : colors.primary} />
      ) : (
        <AppText
          variant="body"
          style={variant === 'primary' ? styles.primaryText : styles.secondaryText}
        >
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryText: {
    color: colors.background,
    fontWeight: '600',
  },
  secondaryText: {
    color: colors.primary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
});
