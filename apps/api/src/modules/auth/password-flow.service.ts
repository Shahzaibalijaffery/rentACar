import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import type { ApiResponse, AuthTokens } from '@rentacar/shared';
import { PasswordService } from '../../common/auth/password.service';
import { MONGO_DATE_UNSET } from '../../common/database/mongo-date-unset';
import { PrismaService } from '../../common/database/prisma.service';
import { EmailService } from '../../common/email/email.service';
import { DomainError } from '../../common/errors/domain.error';
import {
  EMAIL_VERIFICATION_CODE_LENGTH,
  generateEmailVerificationCode,
  hashToken,
  normalizeEmailVerificationCode,
} from '../../common/utils/token.util';
import { AppConfig } from '../../config/env.config';
import { UsersRepository } from '../users/users.repository';
import { TokenService } from './token.service';

const GENERIC_FORGOT_MESSAGE = 'If an account exists for that email, a reset code has been sent.';

@Injectable()
export class PasswordFlowService {
  private readonly logger = new Logger(PasswordFlowService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersRepository.findByEmail(normalizedEmail);

    if (user && user.status !== UserStatus.SUSPENDED) {
      void this.createAndSendResetCode(user.id, user.email).catch((error: unknown) => {
        this.logger.error(
          `Password reset email failed userId=${user.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      });
    }

    return { data: { message: GENERIC_FORGOT_MESSAGE } };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const normalizedCode = normalizeEmailVerificationCode(code);
    if (normalizedCode.length !== EMAIL_VERIFICATION_CODE_LENGTH) {
      throw new DomainError('Invalid or expired reset code', 'INVALID_RESET_CODE', 400);
    }

    const user = await this.usersRepository.findByEmail(email.toLowerCase().trim());
    const record = user
      ? await this.prisma.passwordResetToken.findFirst({
          where: {
            userId: user.id,
            tokenHash: hashToken(normalizedCode),
            usedAt: MONGO_DATE_UNSET,
            expiresAt: { gt: new Date() },
          },
        })
      : null;

    if (!user || !record) {
      throw new DomainError('Invalid or expired reset code', 'INVALID_RESET_CODE', 400);
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new DomainError('Account is suspended', 'ACCOUNT_SUSPENDED', 403);
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
    ]);

    await this.tokenService.revokeAllRefreshTokensForUser(user.id);

    return { data: { message: 'Password updated. You can sign in now.' } };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<{ message: string } & AuthTokens>> {
    if (currentPassword === newPassword) {
      throw new DomainError(
        'New password must be different from the current password',
        'PASSWORD_UNCHANGED',
        400,
      );
    }

    const user = await this.usersRepository.getByIdOrThrow(userId);
    const currentValid = await this.passwordService.compare(currentPassword, user.passwordHash);
    if (!currentValid) {
      throw new DomainError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD', 400);
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    const updated = await this.usersRepository.updatePasswordHash(user.id, passwordHash);
    await this.tokenService.revokeAllRefreshTokensForUser(user.id);
    const tokens = await this.tokenService.issueTokens(updated);

    return {
      data: {
        message: 'Password updated',
        ...tokens,
      },
    };
  }

  private async createAndSendResetCode(userId: string, email: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: MONGO_DATE_UNSET },
      data: { usedAt: new Date() },
    });

    const code = generateEmailVerificationCode();
    const minutes = this.configService.get('passwordResetExpiresMinutes', { infer: true });
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(code), expiresAt },
    });

    await this.emailService.sendEmail({
      to: email,
      subject: 'Your RentACar password reset code',
      text: `Your RentACar password reset code is ${code}.\n\nEnter this 6-digit code in the app. It expires in ${minutes} minutes.`,
      html: `<p>Your RentACar password reset code is:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>Enter this 6-digit code in the app. It expires in ${minutes} minutes.</p>`,
    });
  }
}
