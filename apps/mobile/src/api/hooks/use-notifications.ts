import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  NotificationUnreadCount,
  NotificationView,
  RegisterDeviceTokenRequest,
} from '@rentacar/shared';
import { apiRequest, apiRequestPaginated } from '@/api/client';
import { notificationKeys } from '@/api/keys/notification.keys';

export function useNotificationsQuery(page = 1) {
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: async () => {
      const result = await apiRequestPaginated<NotificationView>(
        `/notifications?page=${page}&pageSize=20`,
      );
      return result.data;
    },
    refetchInterval: 8_000,
    refetchOnMount: 'always',
  });
}

export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => apiRequest<NotificationUnreadCount>('/notifications/unread-count'),
    refetchInterval: 8_000,
    refetchOnMount: 'always',
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function registerDeviceToken(body: RegisterDeviceTokenRequest): Promise<{ ok: true }> {
  return apiRequest('/notifications/device-token', { method: 'POST', body });
}

export function unregisterDeviceToken(token: string): Promise<{ ok: true }> {
  return apiRequest('/notifications/device-token', { method: 'DELETE', body: { token } });
}
