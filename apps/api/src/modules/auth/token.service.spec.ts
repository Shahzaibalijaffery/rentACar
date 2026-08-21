import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { hashToken } from '../../common/utils/token.util';
import { TokenService } from './token.service';

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
  passwordHash: 'hashed',
  fullName: 'Owner',
  cnic: '3520212345671',
  phone: '+923001234567',
  profilePhotoUrl: null,
  status: UserStatus.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: { signAsync: jest.Mock };
  let prisma: {
    refreshToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(() => {
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };
    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'jwtAccessExpiresIn') {
          return '15m';
        }
        if (key === 'jwtRefreshExpiresIn') {
          return '7d';
        }
        if (key === 'jwtAccessSecret') {
          return 'access-secret';
        }
        return undefined;
      }),
    };

    service = new TokenService(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('issues a new access token without rotating the refresh token', async () => {
    const refreshToken = 'keep-this-refresh-token';
    prisma.refreshToken.findFirst.mockResolvedValue({
      id: 'rt-1',
      tokenHash: hashToken(refreshToken),
      user,
    });

    const result = await service.refreshTokens(refreshToken);

    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toBe(refreshToken);
    expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown refresh token', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(service.refreshTokens('missing')).rejects.toThrow('INVALID_REFRESH_TOKEN');
  });
});
