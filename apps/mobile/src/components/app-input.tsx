import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { colors, radii, spacing, typography } from '@/theme';

type AppInputProps = TextInputProps & {
  icon?: AppIconName;
};

export function AppInput({ style, icon, ...props }: AppInputProps) {
  const input = (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      style={[styles.input, icon ? styles.inputWithIcon : null, typography.body, style]}
      autoCapitalize="none"
      {...props}
    />
  );

  if (!icon) {
    return input;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <AppIcon name={icon} size={18} color={colors.textSecondary} />
      </View>
      {input}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  icon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
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
  inputWithIcon: {
    paddingLeft: 44,
  },
});
