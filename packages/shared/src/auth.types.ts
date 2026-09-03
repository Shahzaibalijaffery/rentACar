import type { UserPlanLimits } from './user-plan.limits';
import type { UserPlan } from './user-plan.types';
import type { RatingSummary } from './rating.types';
import type { VehiclePublicView } from './vehicle.types';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  cnic: string;
  phone: string;
  profilePhotoUrl: string | null;
  status: UserStatus;
  plan: UserPlan;
  planLimits: UserPlanLimits;
  emailVerified: boolean;
  createdAt: string;
};

export type UserPublicProfile = {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
};

export type LookupUserByCnicRequest = {
  cnic: string;
};

export type UserProfileSearchResult = {
  user: UserPublicProfile;
  renterRating: RatingSummary;
  vehicles: VehiclePublicView[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type RegisterResponse = {
  message: string;
  userId: string;
};

export type LoginResponse = AuthTokens & {
  user: UserProfile;
};

export type RefreshResponse = AuthTokens;

export type VerifyEmailRequest = {
  email: string;
  code: string;
};

export type VerifyEmailResponse = {
  message: string;
  user: UserProfile;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  newPassword: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = AuthTokens & {
  message: string;
};
