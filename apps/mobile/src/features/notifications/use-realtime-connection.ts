import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import type { RealtimeEvent } from '@rentacar/shared';
import { applyRealtimeEvent } from '@/features/notifications/apply-realtime-event';
import { env } from '@/config/env';
import { getAccessToken } from '@/stores/auth-store';

let socket: Socket | null = null;

function connectRealtime(token: string): void {
  disconnectRealtime();

  socket = io(`${env.wsBaseUrl}/realtime`, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  socket.on('connect', () => {
    applyRealtimeEvent({ type: 'STATE_SYNC' });
  });

  socket.on('notification', (event: RealtimeEvent) => {
    applyRealtimeEvent(event);
  });
}

export function disconnectRealtime(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

export function useRealtimeConnection(accessToken: string | null): void {
  useEffect(() => {
    if (!accessToken) {
      disconnectRealtime();
      return;
    }

    connectRealtime(accessToken);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && getAccessToken()) {
        applyRealtimeEvent({ type: 'STATE_SYNC' });
        if (!socket?.connected && getAccessToken()) {
          connectRealtime(getAccessToken() as string);
        }
      }
    };

    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      sub.remove();
      disconnectRealtime();
    };
  }, [accessToken]);
}
