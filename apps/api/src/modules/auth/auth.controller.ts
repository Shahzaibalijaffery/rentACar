import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type {
  ApiResponse,
  AuthTokens,
  LoginResponse,
  RefreshResponse,
  RegisterResponse,
  VerifyEmailResponse,
} from '@rentacar/shared';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password-flow.dto';
import { RegisterDto } from './dto/register.dto';
import { LogoutDto, RefreshTokenDto } from './dto/token.dto';
import { ResendVerificationDto, VerifyEmailDto } from './dto/verify-email.dto';
import { PasswordFlowService } from './password-flow.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordFlowService: PasswordFlowService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto): Promise<ApiResponse<RegisterResponse>> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto): Promise<ApiResponse<LoginResponse>> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('logout')
  logout(@Body() dto: LogoutDto): Promise<ApiResponse<{ message: string }>> {
    return this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  refresh(@Body() dto: RefreshTokenDto): Promise<ApiResponse<RefreshResponse>> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<ApiResponse<VerifyEmailResponse>> {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Public()
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ApiResponse<{ message: string }>> {
    return this.passwordFlowService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<ApiResponse<{ message: string }>> {
    return this.passwordFlowService.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  @Post('change-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  changePassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<ApiResponse<{ message: string } & AuthTokens>> {
    return this.passwordFlowService.changePassword(
      currentUser.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
