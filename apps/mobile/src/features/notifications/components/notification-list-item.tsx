import { Pressable, StyleSheet, View } from 'react-native';
import type { NotificationView } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/app-text';
import { getCurrentLocale } from '@/i18n';
import { getIntlTag } from '@/i18n/locale.types';
import { colors, radii, shadows, spacing } from '@/theme';

type NotificationListItemProps = {
  item: NotificationView;
  onPress: () => void;
};

export function NotificationListItem({ item, onPress }: NotificationListItemProps) {
  const { t } = useTranslation('notifications');
  const unread = item.readAt === null;
  const title = t(`types.${item.type}`, { defaultValue: item.type });
  const when = new Date(item.createdAt).toLocaleString(getIntlTag(getCurrentLocale()), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `${title}, ${when}` : title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        unread ? styles.unread : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.row}>
        {unread ? <View accessibilityElementsHidden style={styles.dot} /> : <View style={styles.dotSpacer} />}
        <View style={styles.body}>
          <AppText variant="heading">{title}</AppText>
          <AppText variant="caption" style={styles.when}>
            {when}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    ...shadows.sm,
  },
  unread: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.94,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  dotSpacer: {
    width: 8,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  when: {
    color: colors.textSecondary,
  },
});
