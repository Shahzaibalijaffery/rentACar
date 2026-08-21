import { User, UserStatus } from '@prisma/client';
import type { AgreementParticipant, UserProfile, UserPublicProfile } from '@rentacar/shared';

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    cnic: user.cnic,
    phone: user.phone,
    profilePhotoUrl: user.profilePhotoUrl,
    status: user.status,
    emailVerified: user.emailVerifiedAt !== null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toUserPublicProfile(
  user: Pick<User, 'id' | 'fullName' | 'profilePhotoUrl'>,
): UserPublicProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    profilePhotoUrl: user.profilePhotoUrl,
  };
}

export function toAgreementParticipant(
  user: Pick<User, 'id' | 'fullName' | 'profilePhotoUrl' | 'cnic'>,
): AgreementParticipant {
  return {
    id: user.id,
    fullName: user.fullName,
    profilePhotoUrl: user.profilePhotoUrl,
    cnic: user.cnic,
  };
}

export function isUserActive(user: Pick<User, 'status'>): boolean {
  return user.status === UserStatus.ACTIVE || user.status === UserStatus.PENDING_VERIFICATION;
}
