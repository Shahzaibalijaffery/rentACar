import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsAccountPassword } from './password-constraints';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsAccountPassword()
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d-]+$/, { message: 'CNIC must contain digits and optional dashes' })
  cnic!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d+\s-]+$/, { message: 'Phone must contain digits' })
  phone!: string;
}
