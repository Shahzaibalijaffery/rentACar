import { UserPlan, UserStatus } from '@prisma/client';
import { hasMinimumPlan, resolveUserPlan } from '@rentacar/shared';
import { toUserProfile } from './user.mapper';

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
  plan: UserPlan.PRO,
  renterRatingAverage: null,
  renterRatingCount: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('user plan mapping', () => {
  it('includes the stored plan on the profile', () => {
    expect(toUserProfile(user).plan).toBe('PRO');
    expect(toUserProfile(user).planLimits).toEqual({
      maxListedVehicles: 4,
      maxVehiclePhotos: 15,
      maxHandoverPhotos: 15,
    });
  });

  it('defaults missing plans to Starter (free)', () => {
    expect(resolveUserPlan(undefined)).toBe('FREE');
    expect(toUserProfile({ ...user, plan: undefined as never }).plan).toBe('FREE');
  });

  it('compares plan ranks for later feature gates', () => {
    expect(hasMinimumPlan('FREE', 'FREE')).toBe(true);
    expect(hasMinimumPlan('LITE', 'FREE')).toBe(true);
    expect(hasMinimumPlan('FREE', 'LITE')).toBe(false);
    expect(hasMinimumPlan('PRO', 'LITE')).toBe(true);
    expect(hasMinimumPlan('BUSINESS', 'PRO')).toBe(true);
  });
});
