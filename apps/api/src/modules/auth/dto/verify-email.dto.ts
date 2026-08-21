import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(20)
  token!: string;
}

import { IsEmail, MaxLength } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
