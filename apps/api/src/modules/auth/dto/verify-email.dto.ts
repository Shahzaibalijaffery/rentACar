import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';
import { EMAIL_VERIFICATION_CODE_LENGTH } from '../../../common/utils/token.util';

export class VerifyEmailDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Matches(new RegExp(`^\\d{${EMAIL_VERIFICATION_CODE_LENGTH}}$`), {
    message: 'Verification code must be 6 digits',
  })
  code!: string;
}

export class ResendVerificationDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
