import { GlobalExceptionFilter } from './global-exception.filter';
import { DomainError } from '../errors/domain.error';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  it('maps DomainError to ApiErrorBody shape', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    filter.catch(new DomainError('Invalid transition', 'INVALID_TRANSITION', 409), {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as never);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'Invalid transition',
      errorCode: 'INVALID_TRANSITION',
      details: undefined,
    });
  });
});
