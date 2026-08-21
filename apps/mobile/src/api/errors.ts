import type { ApiErrorBody } from '@rentacar/shared';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorCode?: string;
  readonly details?: unknown;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.errorCode = body.errorCode;
    this.details = body.details;
  }
}

export function parseApiErrorBody(payload: unknown): ApiErrorBody | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const body = payload as Record<string, unknown>;
  const message = body.message;
  const statusCode = body.statusCode;

  if (typeof statusCode !== 'number' || typeof message !== 'string') {
    return null;
  }

  return {
    statusCode,
    message,
    errorCode: typeof body.errorCode === 'string' ? body.errorCode : undefined,
    details: body.details,
  };
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError({
      statusCode: 0,
      message: error.message,
      errorCode: 'NETWORK_ERROR',
    });
  }

  return new ApiError({
    statusCode: 0,
    message: 'An unexpected error occurred',
    errorCode: 'UNKNOWN_ERROR',
  });
}
