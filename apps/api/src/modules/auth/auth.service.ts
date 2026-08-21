import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User } from '@prisma/client';
import type {
  ApiResponse,
  LoginResponse,
  RefreshResponse,
  RegisterResponse,
  VerifyEmailResponse,
} from '@rentacar/shared';
import { PasswordService } from '../../common/auth/password.service';
import { EmailService } from '../../common/email/email.service';
import { DomainError } from '../../common/errors/domain.error';
import { normalizeCnic } from '../../common/utils/cnic.util';
import { generateSecureToken, hashToken } from '../../common/utils/token.util';
import { AppConfig } from '../../config/env.config';
import { PrismaService } from '../../common/database/prisma.service';
import { toUserProfile } from '../users/user.mapper';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto): Promise<ApiResponse<RegisterResponse>> {
    const email = dto.email.toLowerCase().trim();
    const normalizedCnic = normalizeCnic(dto.cnic);

    const [existingEmail, existingCnic] = await Promise.all([
      this.usersRepository.findByEmail(email),
      this.usersRepository.findByCnic(normalizedCnic),
    ]);

    if (existingEmail) {
      throw new DomainError(
        'An account with this email already exists',
        'EMAIL_ALREADY_EXISTS',
        409,
      );
    }

    if (existingCnic) {
      throw new DomainError('An account with this CNIC already exists', 'CNIC_ALREADY_EXISTS', 409);
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    let user: User;
    try {
      user = await this.usersRepository.create({
        email,
        passwordHash,
        fullName: dto.fullName,
        cnic: normalizedCnic,
      });
    } catch (error) {
      this.handlePrismaUniqueError(error);
    }

    // Email verification disabled for now — auto-verify on registration.
    if (this.isEmailVerificationEnabled()) {
      await this.createAndSendVerificationToken(user.id, user.email);
    } else {
      await this.usersRepository.markEmailVerified(user.id);
    }

    return {
      data: {
        message: this.isEmailVerificationEnabled()
          ? 'Registration successful. Please verify your email.'
          : 'Registration successful. You can sign in now.',
        userId: user.id,
      },
    };
  }

  async login(dto: LoginDto): Promise<ApiResponse<LoginResponse>> {
    let user = await this.usersRepository.findByEmail(dto.email.toLowerCase().trim());

    if (!user) {
      throw new DomainError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    if (user.status === 'SUSPENDED') {
      throw new DomainError('Account is suspended', 'ACCOUNT_SUSPENDED', 403);
    }

    const passwordValid = await this.passwordService.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new DomainError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    if (!this.isEmailVerificationEnabled() && !user.emailVerifiedAt) {
      user = await this.usersRepository.markEmailVerified(user.id);
    }

    const tokens = await this.tokenService.issueTokens(user);

    return {
      data: {
        ...tokens,
        user: toUserProfile(user),
      },
    };
  }

  async logout(refreshToken: string): Promise<ApiResponse<{ message: string }>> {
    await this.tokenService.revokeRefreshToken(refreshToken);
    return { data: { message: 'Logged out successfully' } };
  }

  async refresh(refreshToken: string): Promise<ApiResponse<RefreshResponse>> {
    try {
      const { tokens } = await this.tokenService.refreshTokens(refreshToken);
      return { data: tokens };
    } catch {
      throw new DomainError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }
  }

  async verifyEmail(token: string): Promise<ApiResponse<VerifyEmailResponse>> {
    if (!this.isEmailVerificationEnabled()) {
      throw new DomainError(
        'Email verification is currently disabled',
        'VERIFICATION_DISABLED',
        400,
      );
    }
    const tokenHash = hashToken(token);
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!record) {
      throw new DomainError(
        'Invalid or expired verification token',
        'INVALID_VERIFICATION_TOKEN',
        400,
      );
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          emailVerifiedAt: new Date(),
          status: 'ACTIVE',
        },
      }),
    ]);

    const user = await this.usersRepository.getByIdOrThrow(record.userId);

    return {
      data: {
        message: 'Email verified successfully',
        user: toUserProfile(user),
      },
    };
  }

  async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    if (!this.isEmailVerificationEnabled()) {
      return { data: { message: 'Email verification is currently disabled.' } };
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersRepository.findByEmail(normalizedEmail);

    if (!user) {
      return { data: { message: 'If the account exists, a verification email has been sent.' } };
    }

    if (user.emailVerifiedAt) {
      return { data: { message: 'If the account exists, a verification email has been sent.' } };
    }

    await this.invalidateExistingVerificationTokens(user.id);
    await this.createAndSendVerificationToken(user.id, user.email);

    return { data: { message: 'If the account exists, a verification email has been sent.' } };
  }

  private isEmailVerificationEnabled(): boolean {
    return this.configService.get('emailVerificationEnabled', { infer: true });
  }

  private async createAndSendVerificationToken(userId: string, email: string): Promise<void> {
    const plainToken = generateSecureToken(32);
    const tokenHash = hashToken(plainToken);
    const hours = this.configService.get('emailVerificationExpiresHours', { infer: true });
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    const appUrl = this.configService.get('appUrl', { infer: true });
    const verificationUrl = `${appUrl}/verify-email?token=${plainToken}`;

    await this.emailService.sendEmail({
      to: email,
      subject: 'Verify your RentACar account',
      text: `Verify your email by opening this link: ${verificationUrl}\n\nOr enter this code in the app: ${plainToken}`,
      html: `<p>Verify your email by opening this link:</p><p><a href="${verificationUrl}">Verify email</a></p><p>Or enter this code in the app: <strong>${plainToken}</strong></p>`,
    });
  }

  private async invalidateExistingVerificationTokens(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  handlePrismaUniqueError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.['target']) ? error.meta['target'].join(',') : '';
      if (target.includes('email')) {
        throw new DomainError(
          'An account with this email already exists',
          'EMAIL_ALREADY_EXISTS',
          409,
        );
      }
      if (target.includes('cnic')) {
        throw new DomainError(
          'An account with this CNIC already exists',
          'CNIC_ALREADY_EXISTS',
          409,
        );
      }
    }
    throw error;
  }
}
