import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRES_VERIFIED_EMAIL_KEY = 'requiresVerifiedEmail';
export const RequiresVerifiedEmail = () => SetMetadata(REQUIRES_VERIFIED_EMAIL_KEY, true);
