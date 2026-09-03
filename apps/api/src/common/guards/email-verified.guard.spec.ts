import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { EmailVerifiedGuard } from './email-verified.guard';

function createContext(
  user?: { userId: string; email: string; emailVerified: boolean },
  type: string = 'http',
): ExecutionContext {
  const request = { user };
  return {
    getType: () => type,
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('EmailVerifiedGuard', () => {
  let guard: EmailVerifiedGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let configValues: Record<string, unknown>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    configValues = { emailVerificationEnabled: true };
    const configService = {
      get: jest.fn((key: string) => configValues[key]),
    };

    guard = new EmailVerifiedGuard(
      reflector as unknown as Reflector,
      configService as unknown as ConfigService,
    );
  });

  it('allows all routes when verification is disabled', () => {
    configValues['emailVerificationEnabled'] = false;

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows public routes even when the viewer is unverified', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(
      guard.canActivate(
        createContext({ userId: 'u1', email: 'a@b.com', emailVerified: false }),
      ),
    ).toBe(true);
  });

  it('allows protected routes when the user is verified', () => {
    expect(
      guard.canActivate(
        createContext({ userId: 'u1', email: 'a@b.com', emailVerified: true }),
      ),
    ).toBe(true);
  });

  it('rejects protected routes when the user is not verified', () => {
    expect(() =>
      guard.canActivate(
        createContext({ userId: 'u1', email: 'a@b.com', emailVerified: false }),
      ),
    ).toThrow(ForbiddenException);
  });
});
