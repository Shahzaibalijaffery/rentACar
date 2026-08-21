import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppConfig } from '../../config/env.config';
import { REQUIRES_VERIFIED_EMAIL_KEY } from '../decorators/auth.decorators';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.configService.get('emailVerificationEnabled', { infer: true })) {
      return true;
    }

    const requiresVerified = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_VERIFIED_EMAIL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresVerified) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user?.emailVerified) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Email verification required',
        errorCode: 'EMAIL_NOT_VERIFIED',
      });
    }

    return true;
  }
}
