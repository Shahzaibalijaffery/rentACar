import { ConfigService } from '@nestjs/config';
import { UserPlan, UserStatus } from '@prisma/client';
import { PasswordService } from '../../common/auth/password.service';
import { PrismaService } from '../../common/database/prisma.service';
import { EmailService } from '../../common/email/email.service';
import { UsersRepository } from '../users/users.repository';
import { PasswordFlowService } from './password-flow.service';
import { TokenService } from './token.service';

const baseUser = {
  id: 'user-1',
  email: 'test@example.com',
  emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
  passwordHash: 'hashed',
  fullName: 'Test User',
  cnic: '35202-1234567-1',
  phone: '+923001234567',
  profilePhotoUrl: null,
  status: UserStatus.ACTIVE,
  plan: UserPlan.FREE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('PasswordFlowService', () => {
  let service: PasswordFlowService;
  let usersRepository: jest.Mocked<Pick<UsersRepository, 'findByEmail' | 'getByIdOrThrow' | 'updatePasswordHash'>>;
  let passwordService: jest.Mocked<Pick<PasswordService, 'hash' | 'compare'>>;
  let emailService: jest.Mocked<Pick<EmailService, 'sendEmail'>>;
  let tokenService: jest.Mocked<Pick<TokenService, 'revokeAllRefreshTokensForUser' | 'issueTokens'>>;
  let prisma: {
    passwordResetToken: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    user: { update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      getByIdOrThrow: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    passwordService = {
      hash: jest.fn().mockResolvedValue('new-hash'),
      compare: jest.fn(),
    };
    emailService = { sendEmail: jest.fn().mockResolvedValue(undefined) };
    tokenService = {
      revokeAllRefreshTokensForUser: jest.fn().mockResolvedValue(undefined),
      issueTokens: jest.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
      }),
    };
    prisma = {
      passwordResetToken: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'reset-1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: { update: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'passwordResetExpiresMinutes') {
          return 15;
        }
        return undefined;
      }),
    };

    service = new PasswordFlowService(
      usersRepository as unknown as UsersRepository,
      passwordService as unknown as PasswordService,
      emailService as unknown as EmailService,
      configService as unknown as ConfigService,
      prisma as unknown as PrismaService,
      tokenService as unknown as TokenService,
    );
  });

  it('returns a generic message when the email is unknown', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    const result = await service.forgotPassword('missing@example.com');

    expect(result.data.message).toContain('If an account exists');
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('does not email a suspended account', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      ...baseUser,
      status: UserStatus.SUSPENDED,
    });

    const result = await service.forgotPassword('test@example.com');

    expect(result.data.message).toContain('If an account exists');
    await Promise.resolve();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('resets the password with a valid code and revokes sessions', async () => {
    usersRepository.findByEmail.mockResolvedValue(baseUser);
    prisma.passwordResetToken.findFirst.mockResolvedValue({ id: 'reset-1', userId: 'user-1' });

    const result = await service.resetPassword('test@example.com', '123456', 'NewPass1');

    expect(result.data.message).toContain('sign in');
    expect(passwordService.hash).toHaveBeenCalledWith('NewPass1');
    expect(tokenService.revokeAllRefreshTokensForUser).toHaveBeenCalledWith('user-1');
  });

  it('rejects an invalid reset code', async () => {
    usersRepository.findByEmail.mockResolvedValue(baseUser);
    prisma.passwordResetToken.findFirst.mockResolvedValue(null);

    await expect(
      service.resetPassword('test@example.com', '000000', 'NewPass1'),
    ).rejects.toMatchObject({ errorCode: 'INVALID_RESET_CODE' });
  });

  it('changes password when the current password matches', async () => {
    usersRepository.getByIdOrThrow.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(true);
    usersRepository.updatePasswordHash.mockResolvedValue({
      ...baseUser,
      passwordHash: 'new-hash',
    });

    const result = await service.changePassword('user-1', 'OldPass1', 'NewPass1');

    expect(result.data.accessToken).toBe('access');
    expect(tokenService.revokeAllRefreshTokensForUser).toHaveBeenCalledWith('user-1');
    expect(tokenService.issueTokens).toHaveBeenCalled();
  });

  it('rejects change password when the current password is wrong', async () => {
    usersRepository.getByIdOrThrow.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(false);

    await expect(service.changePassword('user-1', 'WrongPass1', 'NewPass1')).rejects.toMatchObject({
      errorCode: 'INVALID_CURRENT_PASSWORD',
    });
  });

  it('rejects change password when the new password is unchanged', async () => {
    await expect(service.changePassword('user-1', 'SamePass1', 'SamePass1')).rejects.toMatchObject({
      errorCode: 'PASSWORD_UNCHANGED',
    });
  });
});
