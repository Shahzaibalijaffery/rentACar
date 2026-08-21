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
  STORAGE_LOCAL_DIR: Joi.string().default('./storage'),
  STORAGE_PUBLIC_BASE_URL: Joi.string().uri().default('http://localhost:3000/api/v1/files'),
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
  storageLocalDir: string;
  storagePublicBaseUrl: string;
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
  storageLocalDir: process.env['STORAGE_LOCAL_DIR'] ?? './storage',
  storagePublicBaseUrl:
    process.env['STORAGE_PUBLIC_BASE_URL'] ?? 'http://localhost:3000/api/v1/files',
});
