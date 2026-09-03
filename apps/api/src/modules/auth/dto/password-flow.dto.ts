import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { EMAIL_VERIFICATION_CODE_LENGTH } from '../../../common/utils/token.util';
import { IsAccountPassword } from './password-constraints';

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Matches(new RegExp(`^\\d{${EMAIL_VERIFICATION_CODE_LENGTH}}$`), {
    message: 'Reset code must be 6 digits',
  })
  code!: string;

  @IsAccountPassword()
  newPassword!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  currentPassword!: string;

  @IsAccountPassword()
  newPassword!: string;
}
