import { GlobalExceptionFilter } from './global-exception.filter';
import { DomainError } from '../errors/domain.error';

function httpHost(status: jest.Mock, json: jest.Mock) {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'POST', url: '/api/v1/auth/register' }),
    }),
  } as never;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  it('maps DomainError to ApiErrorBody shape', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    filter.catch(new DomainError('Invalid transition', 'INVALID_TRANSITION', 409), httpHost(status, json));

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'Invalid transition',
      errorCode: 'INVALID_TRANSITION',
      details: undefined,
    });
  });
});
