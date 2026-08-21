import type { ApiResponse } from '@rentacar/shared';
import { env } from '@/config/env';
import { buildAuthHeaders } from '@/api/auth-headers';
import {
  clearStoredSession,
  handleUnauthorizedRequest,
  shouldLogoutAfterUnauthorized,
} from '@/services/session-service';
import { ApiError, parseApiErrorBody, toApiError } from './errors';

export type UploadFileInput = {
  uri: string;
  type: string;
  name: string;
};

async function executeUpload<T>(
  path: string,
  file: UploadFileInput,
  method: 'POST',
): Promise<T> {
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.name,
  });

  const response = await fetch(url, {
    method,
    headers: buildAuthHeaders(),
    body: formData,
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = parseApiErrorBody(payload);
    if (errorBody) {
      throw new ApiError(errorBody);
    }

    throw new ApiError({
      statusCode: response.status,
      message: response.statusText || 'Upload failed',
    });
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

export async function apiUploadFile<T>(
  path: string,
  file: UploadFileInput,
  method: 'POST' = 'POST',
  retry = false,
): Promise<T> {
  try {
    return await executeUpload<T>(path, file, method);
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError.statusCode === 401 && !retry) {
      const refreshed = await handleUnauthorizedRequest();
      if (refreshed) {
        return apiUploadFile<T>(path, file, method, true);
      }

      if (shouldLogoutAfterUnauthorized(apiError)) {
        await clearStoredSession();
      }
    }

    throw apiError;
  }
}
