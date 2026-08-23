import { ActivityIndicator, Pressable, PressableProps, StyleSheet } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { colors, radii, shadows, spacing } from '@/theme';

type AppButtonProps = PressableProps & {
  title: string;
  icon?: AppIconName;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
};

export function AppButton({
  title,
  icon,
  loading = false,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled ?? loading;
  const iconColor =
    variant === 'primary'
      ? colors.textOnPrimary
      : variant === 'danger'
        ? colors.error
        : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        variantStyles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textOnPrimary : colors.primary} />
      ) : (
        <>
          {icon ? <AppIcon name={icon} size={size === 'sm' ? 16 : 18} color={iconColor} /> : null}
          <AppText variant="body" style={[styles.text, textStyles[variant]]}>
            {title}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.errorMuted,
    borderWidth: 1,
    borderColor: colors.error,
  },
});

const textStyles = StyleSheet.create({
  primary: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  secondary: {
    color: colors.primary,
    fontWeight: '600',
  },
  ghost: {
    color: colors.primary,
    fontWeight: '600',
  },
  danger: {
    color: colors.error,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  md: {
    minHeight: 52,
  },
  sm: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  text: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});
