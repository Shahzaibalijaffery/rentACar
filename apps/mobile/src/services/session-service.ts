import { env } from '@/config/env';
import { ApiError, parseApiErrorBody } from '@/api/errors';
import { clearRefreshToken, getRefreshToken, saveRefreshToken } from '@/services/secure-storage';
import { resetAppMode } from '@/stores/app-mode-store';
import { useAuthStore } from '@/stores/auth-store';

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

let restorePromise: Promise<boolean> | null = null;
let refreshPromise: Promise<string | null> | null = null;

async function persistSession(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  useAuthStore.getState().setAccessToken(tokens.accessToken);
  await saveRefreshToken(tokens.refreshToken);
}

async function requestRefreshToken(refreshToken: string): Promise<RefreshResponse> {
  const url = `${env.apiBaseUrl}/auth/refresh`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = parseApiErrorBody(payload);
    if (errorBody) {
      throw new ApiError(errorBody);
    }

    throw new ApiError({
      statusCode: response.status,
      message: response.statusText || 'Refresh failed',
    });
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: RefreshResponse }).data;
  }

  throw new ApiError({
    statusCode: response.status,
    message: 'Invalid refresh response',
  });
}

function isInvalidRefreshTokenError(error: unknown): boolean {
  return error instanceof ApiError && error.errorCode === 'INVALID_REFRESH_TOKEN';
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 401;
}

export async function clearStoredSession(): Promise<void> {
  useAuthStore.getState().clearSession();
  resetAppMode();
  await clearRefreshToken();
}

export async function refreshSessionFromStorage(refreshToken?: string): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const token = refreshToken ?? (await getRefreshToken());
    if (!token) {
      return null;
    }

    try {
      const tokens = await requestRefreshToken(token);
      await persistSession(tokens);
      return tokens.accessToken;
    } catch (error) {
      if (isInvalidRefreshTokenError(error)) {
        await clearStoredSession();
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function restoreSessionFromStorage(): Promise<boolean> {
  if (restorePromise) {
    return restorePromise;
  }

  restorePromise = (async () => {
    const { accessToken, isHydrated } = useAuthStore.getState();

    if (isHydrated && accessToken) {
      return true;
    }

    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      useAuthStore.getState().setHydrated(true);
      return false;
    }

    if (accessToken) {
      useAuthStore.getState().setHydrated(true);
      return true;
    }

    const nextAccessToken = await refreshSessionFromStorage(refreshToken);
    useAuthStore.getState().setHydrated(true);
    return nextAccessToken !== null;
  })().finally(() => {
    restorePromise = null;
  });

  return restorePromise;
}

export async function handleUnauthorizedRequest(): Promise<string | null> {
  return refreshSessionFromStorage();
}

export function shouldLogoutAfterUnauthorized(error: unknown): boolean {
  return isInvalidRefreshTokenError(error);
}

export function isAuthFailure(error: unknown): boolean {
  return isUnauthorizedError(error);
}
