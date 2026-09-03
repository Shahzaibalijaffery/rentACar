import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus, type User } from '@prisma/client';
import type { AuthTokens } from '@rentacar/shared';
import { PrismaService } from '../../common/database/prisma.service';
import { MONGO_DATE_UNSET } from '../../common/database/mongo-date-unset';
import {
  generateSecureToken,
  hashToken,
  parseDurationToSeconds,
} from '../../common/utils/token.util';
import { AppConfig } from '../../config/env.config';

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
    const { accessToken, expiresIn } = await this.signAccessToken(user);
    const refreshExpiresIn = this.configService.get('jwtRefreshExpiresIn', { infer: true });
    const refreshToken = generateSecureToken(48);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: this.parseRefreshExpiryDate(refreshExpiresIn),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async refreshTokens(refreshToken: string): Promise<{ user: User; tokens: AuthTokens }> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: MONGO_DATE_UNSET,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored || stored.user.status === UserStatus.SUSPENDED) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const { accessToken, expiresIn } = await this.signAccessToken(stored.user);
    return {
      user: stored.user,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn,
      },
    };
  }

  private async signAccessToken(user: User): Promise<{ accessToken: string; expiresIn: number }> {
    const accessExpiresIn = this.configService.get('jwtAccessExpiresIn', { infer: true });
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      emailVerified: user.emailVerifiedAt !== null,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwtAccessSecret', { infer: true }),
      expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    return {
      accessToken,
      expiresIn: parseDurationToSeconds(accessExpiresIn),
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: MONGO_DATE_UNSET },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: MONGO_DATE_UNSET },
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
