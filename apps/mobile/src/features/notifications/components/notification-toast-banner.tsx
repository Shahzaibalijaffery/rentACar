import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { targetForNotification } from '@/features/notifications/notification-navigation';
import { useNotificationToastStore } from '@/features/notifications/notification-toast-store';
import { openNotificationTarget } from '@/features/notifications/open-notification-target';
import { getActiveAppMode } from '@/stores/app-mode-store';
import { colors, radii, shadows, spacing } from '@/theme';

const AUTO_DISMISS_MS = 5000;

export function NotificationToastBanner() {
  const { t } = useTranslation('notifications');
  const alert = useNotificationToastStore((state) => state.alert);
  const dismiss = useNotificationToastStore((state) => state.dismiss);

  useEffect(() => {
    if (!alert) {
      return;
    }
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [alert, dismiss]);

  if (!alert) {
    return null;
  }

  const title = t(`types.${alert.type}`, { defaultValue: alert.type });
  const body = t(`bodies.${alert.type}`, { defaultValue: '' });

  const open = () => {
    const target = targetForNotification(alert, getActiveAppMode());
    dismiss();
    openNotificationTarget(target);
  };

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('toastA11y', { title })}
        onPress={open}
        style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      >
        <View style={styles.icon}>
          <AppIcon name="bell" size={18} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <AppText variant="heading" numberOfLines={1}>
            {title}
          </AppText>
          {body ? (
            <AppText variant="caption" numberOfLines={2} style={styles.body}>
              {body}
            </AppText>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    zIndex: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  pressed: {
    opacity: 0.94,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  body: {
    color: colors.textSecondary,
  },
});
