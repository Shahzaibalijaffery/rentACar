import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useUnreadNotificationCountQuery } from '@/api/hooks/use-notifications';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import type { AppStackParamList } from '@/navigation/types';
import { colors } from '@/theme';

type Props = {
  color?: string;
};

export function NotificationBellButton({ color = colors.primary }: Props) {
  const { t } = useTranslation('notifications');
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const unreadQuery = useUnreadNotificationCountQuery();
  const count = unreadQuery.data?.count ?? 0;
  const badge = count > 99 ? '99+' : String(count);
  const label = count > 0 ? t('bellA11yUnread', { count }) : t('bellA11y');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => navigation.navigate('Notifications')}
      style={styles.button}
    >
      <AppIcon name="bell" size={22} color={color} />
      {count > 0 ? (
        <View style={styles.badge}>
          <AppText variant="caption" style={styles.badgeText}>
            {badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
  },
});
