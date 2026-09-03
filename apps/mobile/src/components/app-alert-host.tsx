import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import {
  dismissAppAlert,
  useAppAlertStore,
  type AppAlertButton,
} from '@/stores/app-alert-store';
import { colors, radii, shadows, spacing } from '@/theme';

export function AppAlertHost() {
  const { t } = useTranslation('common');
  const current = useAppAlertStore((state) => state.current);

  if (!current) {
    return null;
  }

  const buttons = current.buttons.map((button) =>
    button.text === 'OK' ? { ...button, text: t('ok') } : button,
  );

  const runButton = (button: AppAlertButton) => {
    dismissAppAlert();
    button.onPress?.();
  };

  const cancelButton = buttons.find((button) => button.style === 'cancel');

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => runButton(cancelButton ?? buttons[buttons.length - 1]!)}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
          style={StyleSheet.absoluteFill}
          onPress={() => runButton(cancelButton ?? { text: t('ok') })}
        />
        <View
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={styles.card}
        >
          <AppText variant="heading" style={styles.title}>
            {current.title}
          </AppText>
          {current.message ? (
            <AppText variant="body" style={styles.message}>
              {current.message}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            {buttons.map((button, index) => (
              <AppButton
                key={`${button.text}-${index}`}
                title={button.text}
                variant={variantForButton(button, buttons)}
                size={buttons.length > 1 ? 'sm' : 'md'}
                onPress={() => runButton(button)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function variantForButton(
  button: AppAlertButton,
  buttons: AppAlertButton[],
): 'primary' | 'secondary' | 'ghost' | 'danger' {
  if (button.style === 'destructive') {
    return 'danger';
  }
  if (button.style === 'cancel') {
    return buttons.length > 1 ? 'ghost' : 'primary';
  }
  const actions = buttons.filter((item) => item.style !== 'cancel');
  if (actions.length === 1) {
    return 'primary';
  }
  return buttons.length === 1 ? 'primary' : 'secondary';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(28, 22, 18, 0.48)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  title: {
    color: colors.text,
  },
  message: {
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
