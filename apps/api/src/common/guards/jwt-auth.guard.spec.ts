import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

function createContext(
  headers: Record<string, string> = {},
  type: string = 'http',
): ExecutionContext {
  const request = { headers, user: undefined };
  return {
    getType: () => type,
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let jwtService: { verifyAsync: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    jwtService = { verifyAsync: jest.fn() };
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('attaches the viewer on public routes when a valid token is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'owner-1',
      email: 'owner@example.com',
      emailVerified: true,
    });

    const context = createContext({ authorization: 'Bearer valid-token' });
    await expect(guard.canActivate(context)).resolves.toBe(true);

    const request = context.switchToHttp().getRequest() as { user?: { userId: string } };
    expect(request.user?.userId).toBe('owner-1');
  });

  it('allows public routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    const context = createContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects protected routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('skips websocket connections so the realtime gateway can authenticate', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(guard.canActivate(createContext({}, 'ws'))).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });
});
