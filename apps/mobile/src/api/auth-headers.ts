import { getAccessToken } from '@/stores/auth-store';

type AuthHeaderOptions = {
  auth?: boolean;
};

export function buildAuthHeaders(
  options: AuthHeaderOptions = { auth: true },
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}
