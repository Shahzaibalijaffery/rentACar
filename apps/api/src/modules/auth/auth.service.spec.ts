import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { PasswordService } from '../../common/auth/password.service';
import { EmailService } from '../../common/email/email.service';
import { PrismaService } from '../../common/database/prisma.service';
import { UsersRepository } from '../users/users.repository';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

const baseUser = {
  id: 'user-1',
  email: 'test@example.com',
  emailVerifiedAt: null,
  passwordHash: 'hashed',
  fullName: 'Test User',
  cnic: '35202-1234567-1',
  profilePhotoUrl: null,
  status: UserStatus.PENDING_VERIFICATION,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let emailService: jest.Mocked<EmailService>;
  let prisma: {
    emailVerificationToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    user: { update: jest.Mock };
    $transaction: jest.Mock;
  };

  let configValues: Record<string, unknown>;

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      findByCnic: jest.fn(),
      create: jest.fn(),
      getByIdOrThrow: jest.fn(),
      findById: jest.fn(),
      updateProfile: jest.fn(),
      markEmailVerified: jest.fn(),
    };

    passwordService = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
      compare: jest.fn(),
    };

    tokenService = {
      issueTokens: jest.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
      }),
      refreshTokens: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    prisma = {
      emailVerificationToken: {
        create: jest.fn().mockResolvedValue({ id: 'token-1' }),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: { update: jest.fn() },
      $transaction: jest.fn(),
    };

    configValues = {
      emailVerificationExpiresHours: 24,
      emailVerificationEnabled: false,
      appUrl: 'http://localhost:3000',
    };

    const configService = {
      get: jest.fn((key: string) => configValues[key]),
    } as unknown as ConfigService;

    authService = new AuthService(
      usersRepository,
      passwordService,
      tokenService,
      emailService,
      configService as ConfigService<never, true>,
      prisma as unknown as PrismaService,
    );
  });

  it('registers a new user without verification email when disabled', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.findByCnic.mockResolvedValue(null);
    usersRepository.create.mockResolvedValue(baseUser);
    usersRepository.markEmailVerified.mockResolvedValue({
      ...baseUser,
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
    });

    const result = await authService.register({
      email: 'test@example.com',
      password: 'Password1',
      fullName: 'Test User',
      cnic: '35202-1234567-1',
    });

    expect(result.data.userId).toBe('user-1');
    expect(result.data.message).toContain('sign in');
    expect(passwordService.hash).toHaveBeenCalledWith('Password1');
    expect(usersRepository.markEmailVerified).toHaveBeenCalledWith('user-1');
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    usersRepository.findByEmail.mockResolvedValue(baseUser);
    usersRepository.findByCnic.mockResolvedValue(null);

    await expect(
      authService.register({
        email: 'test@example.com',
        password: 'Password1',
        fullName: 'Test User',
        cnic: '35202-1234567-1',
      }),
    ).rejects.toMatchObject({ errorCode: 'EMAIL_ALREADY_EXISTS' });
  });

  it('rejects duplicate CNIC', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.findByCnic.mockResolvedValue(baseUser);

    await expect(
      authService.register({
        email: 'other@example.com',
        password: 'Password1',
        fullName: 'Test User',
        cnic: '35202-1234567-1',
      }),
    ).rejects.toMatchObject({ errorCode: 'CNIC_ALREADY_EXISTS' });
  });

  it('logs in with valid credentials', async () => {
    usersRepository.findByEmail.mockResolvedValue(baseUser);
    usersRepository.markEmailVerified.mockResolvedValue({
      ...baseUser,
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
    });
    passwordService.compare.mockResolvedValue(true);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(result.data.accessToken).toBe('access');
    expect(result.data.user.email).toBe('test@example.com');
  });

  it('rejects invalid credentials without leaking details', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'missing@example.com', password: 'Password1' }),
    ).rejects.toMatchObject({ errorCode: 'INVALID_CREDENTIALS', statusCode: 401 });
  });

  it('rejects wrong password', async () => {
    usersRepository.findByEmail.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(false);

    await expect(
      authService.login({ email: 'test@example.com', password: 'WrongPass1' }),
    ).rejects.toMatchObject({ errorCode: 'INVALID_CREDENTIALS' });
  });

  it('verifies email with a valid token', async () => {
    configValues['emailVerificationEnabled'] = true;
    prisma.emailVerificationToken.findFirst.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      user: baseUser,
    });
    prisma.$transaction.mockResolvedValue([]);
    usersRepository.getByIdOrThrow.mockResolvedValue({
      ...baseUser,
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
    });

    const result = await authService.verifyEmail('valid-token-value-1234567890');

    expect(result.data.message).toBe('Email verified successfully');
    expect(result.data.user.emailVerified).toBe(true);
  });

  it('rejects expired verification token', async () => {
    configValues['emailVerificationEnabled'] = true;
    prisma.emailVerificationToken.findFirst.mockResolvedValue(null);

    await expect(authService.verifyEmail('expired-token')).rejects.toMatchObject({
      errorCode: 'INVALID_VERIFICATION_TOKEN',
    });
  });

  it('revokes refresh token on logout', async () => {
    const result = await authService.logout('refresh-token');
    expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(result.data.message).toBe('Logged out successfully');
  });
});

describe('PasswordService', () => {
  it('hashes and compares passwords', async () => {
    const service = new PasswordService();
    const hash = await service.hash('Password1');
    expect(hash).not.toBe('Password1');
    await expect(service.compare('Password1', hash)).resolves.toBe(true);
    await expect(service.compare('WrongPass1', hash)).resolves.toBe(false);
  });
});
