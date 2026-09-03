import { useState } from 'react';
import { I18nManager, Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { colors, radii, spacing, typography } from '@/theme';

type AppInputProps = TextInputProps & {
  icon?: AppIconName;
};

export function AppInput({ style, icon, secureTextEntry, ...props }: AppInputProps) {
  const { t } = useTranslation('common');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isRtl = I18nManager.isRTL;
  const showToggle = secureTextEntry === true;
  const hidePassword = showToggle && !passwordVisible;

  const input = (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      autoCapitalize="none"
      {...props}
      secureTextEntry={hidePassword}
      style={[
        styles.input,
        icon ? (isRtl ? styles.leadingPadRtl : styles.leadingPad) : null,
        showToggle ? (isRtl ? styles.trailingPadRtl : styles.trailingPad) : null,
        typography.body,
        style,
      ]}
    />
  );

  if (!icon && !showToggle) {
    return input;
  }

  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={[styles.sideIcon, isRtl ? styles.leadingRtl : styles.leadingLtr]}>
          <AppIcon name={icon} size={18} color={colors.textSecondary} />
        </View>
      ) : null}
      {input}
      {showToggle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={passwordVisible ? t('hidePassword') : t('showPassword')}
          hitSlop={8}
          onPress={() => setPasswordVisible((visible) => !visible)}
          style={[styles.sideIcon, isRtl ? styles.trailingRtl : styles.trailingLtr]}
        >
          <AppIcon
            name={passwordVisible ? 'eye-off' : 'eye'}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const SIDE_INSET = 44;

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  sideIcon: {
    position: 'absolute',
    zIndex: 1,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingLtr: {
    left: spacing.sm,
  },
  leadingRtl: {
    right: spacing.sm,
  },
  trailingLtr: {
    right: spacing.sm,
  },
  trailingRtl: {
    left: spacing.sm,
  },
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
  leadingPad: {
    paddingLeft: SIDE_INSET,
  },
  leadingPadRtl: {
    paddingRight: SIDE_INSET,
  },
  trailingPad: {
    paddingRight: SIDE_INSET,
  },
  trailingPadRtl: {
    paddingLeft: SIDE_INSET,
  },
});
