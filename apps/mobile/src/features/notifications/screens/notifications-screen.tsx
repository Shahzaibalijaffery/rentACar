import { useCallback, useLayoutEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NotificationView } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/api/hooks/use-notifications';
import { AppButton } from '@/components/app-button';
import { EmptyState } from '@/components/empty-state';
import { QueryState } from '@/components/query-state';
import { ScreenLayout } from '@/components/screen-layout';
import { NotificationListItem } from '@/features/notifications/components/notification-list-item';
import { targetForNotification } from '@/features/notifications/notification-navigation';
import { openNotificationTarget } from '@/features/notifications/open-notification-target';
import type { AppStackParamList } from '@/navigation/types';
import { useAppModeStore } from '@/stores/app-mode-store';
import { spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const { t } = useTranslation('notifications');
  const fallbackPerspective = useAppModeStore((state) => state.activeMode);
  const listQuery = useNotificationsQuery(1);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const items = listQuery.data ?? [];
  const hasUnread = items.some((item) => item.readAt === null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('title') });
  }, [navigation, t]);

  useFocusEffect(
    useCallback(() => {
      void listQuery.refetch();
    }, [listQuery.refetch]),
  );

  const openItem = (item: NotificationView) => {
    if (!item.readAt) {
      markRead.mutate(item.id);
    }

    const target = targetForNotification(item, fallbackPerspective);
    if (target.screen === 'Notifications') {
      return;
    }
    openNotificationTarget(target);
  };

  return (
    <ScreenLayout scroll={false} contentStyle={styles.content}>
      <QueryState
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        errorMessage={listQuery.error?.message}
      >
        {items.length === 0 ? (
          <EmptyState title={t('emptyTitle')} message={t('emptyBody')} icon="bell" />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              hasUnread ? (
                <AppButton
                  title={t('markAllRead')}
                  variant="ghost"
                  size="sm"
                  loading={markAllRead.isPending}
                  onPress={() => markAllRead.mutate()}
                />
              ) : undefined
            }
            renderItem={({ item }) => (
              <NotificationListItem item={item} onPress={() => openItem(item)} />
            )}
          />
        )}
      </QueryState>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.md,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
