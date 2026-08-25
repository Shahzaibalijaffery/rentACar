import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  EMAIL_VERIFICATION_EXPIRES_HOURS: Joi.number().integer().min(1).default(24),
  EMAIL_VERIFICATION_ENABLED: Joi.boolean().default(false),
  EMAIL_FROM: Joi.string().email().default('noreply@rentacar.com'),
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),
  R2_ACCOUNT_ID: Joi.string().required(),
  R2_ACCESS_KEY_ID: Joi.string().required(),
  R2_SECRET_ACCESS_KEY: Joi.string().required(),
  R2_BUCKET_NAME: Joi.string().required(),
  R2_PUBLIC_BASE_URL: Joi.string().uri().required(),
  GEOCODING_COUNTRY_CODES: Joi.string().default('pk'),
  GEOCODING_USER_AGENT: Joi.string().default('RentACar/1.0 (peer-to-peer car rental)'),
  FIREBASE_SERVICE_ACCOUNT_JSON: Joi.string().allow('').optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: Joi.string().allow('').optional(),
});

export type AppConfig = {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  emailVerificationExpiresHours: number;
  emailVerificationEnabled: boolean;
  emailFrom: string;
  smtpHost: string | undefined;
  smtpPort: number;
  smtpUser: string | undefined;
  smtpPass: string | undefined;
  appUrl: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  r2PublicBaseUrl: string;
  geocodingCountryCodes: string;
  geocodingUserAgent: string;
  firebaseServiceAccountJson: string | undefined;
  firebaseServiceAccountPath: string | undefined;
};

export default (): AppConfig => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: Number(process.env['PORT'] ?? 3000),
  databaseUrl: process.env['DATABASE_URL'] ?? '',
  jwtAccessSecret: process.env['JWT_ACCESS_SECRET'] ?? '',
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] ?? '',
  jwtAccessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
  jwtRefreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  emailVerificationExpiresHours: Number(process.env['EMAIL_VERIFICATION_EXPIRES_HOURS'] ?? 24),
  emailVerificationEnabled: process.env['EMAIL_VERIFICATION_ENABLED'] === 'true',
  emailFrom: process.env['EMAIL_FROM'] ?? 'noreply@rentacar.com',
  smtpHost: process.env['SMTP_HOST']?.length ? process.env['SMTP_HOST'] : undefined,
  smtpPort: Number(process.env['SMTP_PORT'] ?? 587),
  smtpUser: process.env['SMTP_USER']?.length ? process.env['SMTP_USER'] : undefined,
  smtpPass: process.env['SMTP_PASS']?.length ? process.env['SMTP_PASS'] : undefined,
  appUrl: process.env['APP_URL'] ?? 'http://localhost:3000',
  r2AccountId: process.env['R2_ACCOUNT_ID'] ?? '',
  r2AccessKeyId: process.env['R2_ACCESS_KEY_ID'] ?? '',
  r2SecretAccessKey: process.env['R2_SECRET_ACCESS_KEY'] ?? '',
  r2BucketName: process.env['R2_BUCKET_NAME'] ?? '',
  r2PublicBaseUrl: process.env['R2_PUBLIC_BASE_URL'] ?? '',
  geocodingCountryCodes: process.env['GEOCODING_COUNTRY_CODES'] ?? 'pk',
  geocodingUserAgent:
    process.env['GEOCODING_USER_AGENT'] ?? 'RentACar/1.0 (peer-to-peer car rental)',
  firebaseServiceAccountJson: process.env['FIREBASE_SERVICE_ACCOUNT_JSON']?.length
    ? process.env['FIREBASE_SERVICE_ACCOUNT_JSON']
    : undefined,
  firebaseServiceAccountPath: process.env['FIREBASE_SERVICE_ACCOUNT_PATH']?.length
    ? process.env['FIREBASE_SERVICE_ACCOUNT_PATH']
    : undefined,
});
