import { parseApiErrorBody, toApiError, ApiError } from '@/api/errors';

describe('parseApiErrorBody', () => {
  it('parses a valid API error payload', () => {
    expect(
      parseApiErrorBody({
        statusCode: 404,
        message: 'Not found',
        errorCode: 'NOT_FOUND',
      }),
    ).toEqual({
      statusCode: 404,
      message: 'Not found',
      errorCode: 'NOT_FOUND',
    });
  });

  it('returns null for invalid payloads', () => {
    expect(parseApiErrorBody(null)).toBeNull();
    expect(parseApiErrorBody({ message: 'missing status' })).toBeNull();
  });
});

describe('toApiError', () => {
  it('preserves ApiError instances', () => {
    const error = new ApiError({ statusCode: 400, message: 'Bad request' });
    expect(toApiError(error)).toBe(error);
  });

  it('wraps generic errors', () => {
    const error = toApiError(new Error('Network down'));
    expect(error.message).toBe('Network down');
    expect(error.errorCode).toBe('NETWORK_ERROR');
  });
});
