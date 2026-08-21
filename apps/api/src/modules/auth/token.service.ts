import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../../config/env.config';
import { PrismaService } from '../../common/database/prisma.service';
import {
  generateSecureToken,
  hashToken,
  parseDurationToSeconds,
} from '../../common/utils/token.util';
import type { AuthTokens } from '@rentacar/shared';
import type { User } from '@prisma/client';

type AccessTokenPayload = {
  sub: string;
  email: string;
  emailVerified: boolean;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  async issueTokens(user: User): Promise<AuthTokens> {
    const accessExpiresIn = this.configService.get('jwtAccessExpiresIn', { infer: true });
    const refreshExpiresIn = this.configService.get('jwtRefreshExpiresIn', { infer: true });

    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      emailVerified: user.emailVerifiedAt !== null,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwtAccessSecret', { infer: true }),
      expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = generateSecureToken(48);
    const refreshTokenHash = hashToken(refreshToken);
    const refreshExpiresMs = this.parseRefreshExpiryDate(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshExpiresMs,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseDurationToSeconds(accessExpiresIn),
    };
  }

  async refreshTokens(refreshToken: string): Promise<{ user: User; tokens: AuthTokens }> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(stored.user);
    return { user: stored.user, tokens };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private parseRefreshExpiryDate(duration: string): Date {
    const match = /^(\d+)([smhd])$/.exec(duration.trim());
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';
    const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };
    const ms = value * multipliers[unit];
    return new Date(Date.now() + ms);
  }
}
