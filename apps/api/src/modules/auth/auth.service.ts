import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User, UserStatus } from '@prisma/client';
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
import { normalizePhone } from '../../common/utils/phone.util';
import {
  EMAIL_VERIFICATION_CODE_LENGTH,
  generateEmailVerificationCode,
  hashToken,
  normalizeEmailVerificationCode,
} from '../../common/utils/token.util';
import { AppConfig } from '../../config/env.config';
import { PrismaService } from '../../common/database/prisma.service';
import { MONGO_DATE_UNSET } from '../../common/database/mongo-date-unset';
import { toUserProfile } from '../users/user.mapper';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
    const normalizedPhone = normalizePhone(dto.phone);

    const [existingEmail, existingCnic, existingPhone] = await Promise.all([
      this.usersRepository.findByEmail(email),
      this.usersRepository.findByCnic(normalizedCnic),
      this.usersRepository.findByPhone(normalizedPhone),
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

    if (existingPhone) {
      throw new DomainError(
        'An account with this phone number already exists',
        'PHONE_ALREADY_EXISTS',
        409,
      );
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const verifyEmail = this.isEmailVerificationEnabled();

    let user: User;
    try {
      user = await this.usersRepository.create({
        email,
        passwordHash,
        fullName: dto.fullName,
        cnic: normalizedCnic,
        phone: normalizedPhone,
        ...(verifyEmail
          ? {}
          : { emailVerifiedAt: new Date(), status: UserStatus.ACTIVE }),
      });
    } catch (error) {
      this.handlePrismaUniqueError(error);
    }

    if (verifyEmail) {
      void this.createAndSendVerificationToken(user.id, user.email).catch((error: unknown) => {
        this.logger.error(
          `Verification email failed after registration userId=${user.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      });
    }

    return {
      data: {
        message: verifyEmail
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

    if (this.isEmailVerificationEnabled() && !user.emailVerifiedAt) {
      throw new DomainError(
        'Please verify your email before signing in',
        'EMAIL_NOT_VERIFIED',
        403,
      );
    }

    if (!this.isEmailVerificationEnabled() && !user.emailVerifiedAt) {
      try {
        user = await this.usersRepository.markEmailVerified(user.id);
      } catch (error) {
        this.logger.warn(
          `Auto-verify on login failed userId=${user.id}: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
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

  async verifyEmail(email: string, code: string): Promise<ApiResponse<VerifyEmailResponse>> {
    if (!this.isEmailVerificationEnabled()) {
      throw new DomainError(
        'Email verification is currently disabled',
        'VERIFICATION_DISABLED',
        400,
      );
    }

    const normalizedCode = normalizeEmailVerificationCode(code);
    if (normalizedCode.length !== EMAIL_VERIFICATION_CODE_LENGTH) {
      throw new DomainError(
        'Invalid or expired verification code',
        'INVALID_VERIFICATION_TOKEN',
        400,
      );
    }

    const user = await this.usersRepository.findByEmail(email.toLowerCase().trim());
    const tokenHash = hashToken(normalizedCode);
    const record = user
      ? await this.prisma.emailVerificationToken.findFirst({
          where: {
            userId: user.id,
            tokenHash,
            usedAt: MONGO_DATE_UNSET,
            expiresAt: { gt: new Date() },
          },
        })
      : null;

    if (!record) {
      throw new DomainError(
        'Invalid or expired verification code',
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

    const verifiedUser = await this.usersRepository.getByIdOrThrow(record.userId);

    return {
      data: {
        message: 'Email verified successfully',
        user: toUserProfile(verifiedUser),
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
    void this.createAndSendVerificationToken(user.id, user.email).catch((error: unknown) => {
      this.logger.error(
        `Verification email failed on resend userId=${user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    });

    return { data: { message: 'If the account exists, a verification email has been sent.' } };
  }

  private isEmailVerificationEnabled(): boolean {
    return this.configService.get('emailVerificationEnabled', { infer: true });
  }

  private async createAndSendVerificationToken(userId: string, email: string): Promise<void> {
    await this.invalidateExistingVerificationTokens(userId);

    const code = generateEmailVerificationCode();
    const tokenHash = hashToken(code);
    const hours = this.configService.get('emailVerificationExpiresHours', { infer: true });
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    await this.emailService.sendEmail({
      to: email,
      subject: 'Your RentACar verification code',
      text: `Your RentACar verification code is ${code}.\n\nEnter this 6-digit code in the app. It expires in ${hours} hours.`,
      html: `<p>Your RentACar verification code is:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>Enter this 6-digit code in the app. It expires in ${hours} hours.</p>`,
    });
  }

  private async invalidateExistingVerificationTokens(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: MONGO_DATE_UNSET },
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
      if (target.includes('phone')) {
        throw new DomainError(
          'An account with this phone number already exists',
          'PHONE_ALREADY_EXISTS',
          409,
        );
      }
    }
    throw error;
  }
}
