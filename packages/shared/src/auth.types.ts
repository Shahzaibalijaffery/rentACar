import type { VehiclePublicView } from './vehicle.types';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  cnic: string;
  profilePhotoUrl: string | null;
  status: UserStatus;
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

export type VerifyEmailResponse = {
  message: string;
  user: UserProfile;
};
