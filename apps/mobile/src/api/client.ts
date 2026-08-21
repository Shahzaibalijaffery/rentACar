import type { PaginatedResponse } from '@rentacar/shared';
import { env } from '@/config/env';
import { buildAuthHeaders } from '@/api/auth-headers';
import {
  clearStoredSession,
  handleUnauthorizedRequest,
  shouldLogoutAfterUnauthorized,
} from '@/services/session-service';
import { ApiError, parseApiErrorBody, toApiError } from './errors';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
  _retry?: boolean;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = parseApiErrorBody(payload);
    if (errorBody) {
      throw new ApiError(errorBody);
    }

    throw new ApiError({
      statusCode: response.status,
      message: response.statusText || 'Request failed',
    });
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

async function executeRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, auth, _retry, ...rest } = options;
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...buildAuthHeaders({ auth }),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const authEnabled = options.auth !== false;

  try {
    return await executeRequest<T>(path, options);
  } catch (error) {
    const apiError = toApiError(error);

    if (authEnabled && apiError.statusCode === 401 && !options._retry) {
      const refreshed = await handleUnauthorizedRequest();
      if (refreshed) {
        return executeRequest<T>(path, { ...options, _retry: true });
      }

      if (shouldLogoutAfterUnauthorized(apiError)) {
        await clearStoredSession();
      }
    }

    throw apiError;
  }
}

export async function apiRequestPaginated<T>(
  path: string,
  options: RequestOptions = {},
): Promise<PaginatedResponse<T>> {
  const authEnabled = options.auth !== false;

  try {
    const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const { body, headers, auth, _retry, ...rest } = options;

    const response = await fetch(url, {
      ...rest,
      headers: {
        ...buildAuthHeaders({ auth }),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const errorBody = parseApiErrorBody(payload);
      if (errorBody) {
        throw new ApiError(errorBody);
      }

      throw new ApiError({
        statusCode: response.status,
        message: response.statusText || 'Request failed',
      });
    }

    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      'meta' in payload &&
      Array.isArray((payload as PaginatedResponse<T>).data)
    ) {
      return payload as PaginatedResponse<T>;
    }

    throw new ApiError({
      statusCode: response.status,
      message: 'Invalid paginated response',
    });
  } catch (error) {
    const apiError = toApiError(error);

    if (authEnabled && apiError.statusCode === 401 && !options._retry) {
      const refreshed = await handleUnauthorizedRequest();
      if (refreshed) {
        return apiRequestPaginated<T>(path, { ...options, _retry: true });
      }

      if (shouldLogoutAfterUnauthorized(apiError)) {
        await clearStoredSession();
      }
    }

    throw apiError;
  }
}
