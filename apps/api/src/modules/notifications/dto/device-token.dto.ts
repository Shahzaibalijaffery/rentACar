import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @MinLength(8)
  token!: string;

  @IsIn(['ANDROID'])
  platform!: 'ANDROID';

  @IsOptional()
  @IsIn(['en', 'ur'])
  locale?: 'en' | 'ur';
}

export class UnregisterDeviceTokenDto {
  @IsString()
  @MinLength(8)
  token!: string;
}
