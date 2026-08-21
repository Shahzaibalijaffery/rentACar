import { useAuthStore } from '@/stores/auth-store';
import {
  persistSession,
  restoreSessionFromStorage,
  refreshSessionFromStorage,
} from '@/services/session-service';

jest.mock('@/config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:3000/api/v1' },
}));

const mockSaveSession = jest.fn();
const mockGetStoredSession = jest.fn();
const mockClearRefreshToken = jest.fn();
const mockFetch = jest.fn();

jest.mock('@/services/secure-storage', () => ({
  saveSession: (...args: unknown[]) => mockSaveSession(...args),
  getStoredSession: (...args: unknown[]) => mockGetStoredSession(...args),
  clearRefreshToken: (...args: unknown[]) => mockClearRefreshToken(...args),
}));

describe('session-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ accessToken: null, isHydrated: false });
    mockSaveSession.mockResolvedValue(undefined);
    mockGetStoredSession.mockResolvedValue(null);
    mockClearRefreshToken.mockResolvedValue(undefined);
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as typeof fetch;
  });

  it('restores a stored session without calling refresh', async () => {
    mockGetStoredSession.mockResolvedValue({
      accessToken: 'stored-access',
      refreshToken: 'stored-refresh',
    });

    const restored = await restoreSessionFromStorage();

    expect(restored).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('stored-access');
    expect(useAuthStore.getState().isHydrated).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not log out when refresh fails for a network error', async () => {
    useAuthStore.setState({ accessToken: 'stored-access', isHydrated: true });
    mockGetStoredSession.mockResolvedValue({
      accessToken: 'stored-access',
      refreshToken: 'stored-refresh',
    });
    mockFetch.mockRejectedValue(new Error('Network request failed'));

    const result = await refreshSessionFromStorage('stored-refresh');

    expect(result).toBeNull();
    expect(useAuthStore.getState().accessToken).toBe('stored-access');
    expect(mockClearRefreshToken).not.toHaveBeenCalled();
  });

  it('logs out only when the refresh token is invalid', async () => {
    useAuthStore.setState({ accessToken: 'stored-access', isHydrated: true });
    mockGetStoredSession.mockResolvedValue({
      accessToken: 'stored-access',
      refreshToken: 'stored-refresh',
    });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
        errorCode: 'INVALID_REFRESH_TOKEN',
      }),
    });

    const result = await refreshSessionFromStorage('stored-refresh');

    expect(result).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(mockClearRefreshToken).toHaveBeenCalled();
  });

  it('persists tokens to storage then keeps them in memory', async () => {
    await persistSession({ accessToken: 'access', refreshToken: 'refresh' });

    expect(mockSaveSession).toHaveBeenCalledWith({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect(useAuthStore.getState().accessToken).toBe('access');
  });
});
