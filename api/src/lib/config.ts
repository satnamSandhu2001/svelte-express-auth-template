export function ensureEnvVariables() {
  const required: Array<keyof typeof appConfig> = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    // 'SMTP_USER', TODO
    // 'SMTP_PASSWORD',
    // 'SMTP_HOST',
    'ADMIN_MAIL',
    'DEFAULT_PASS',
  ];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env variable: ${key}`);
    }
  }
}

function getAppConfig() {
  return {
    PORT: parseInt(process.env.PORT || '5500'),
    NODE_ENV: (process.env.NODE_ENV || 'development') as
      | 'development'
      | 'production',
    LOG_LEVEL:
      process.env.LOG_LEVEL || process.env.NODE_ENV !== 'production'
        ? 'debug'
        : 'info',

    DATABASE_URL: process.env.DATABASE_URL as string,

    JWT_SECRET: process.env.JWT_SECRET as string,
    TOKEN_EXPIRES_IN: parseInt(process.env.TOKEN_EXPIRES_IN || '7'),
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
    REFRESH_TOKEN_EXPIRES_IN: parseInt(
      process.env.REFRESH_TOKEN_EXPIRES_IN || '30'
    ),

    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    CORS_ORIGINS: !!process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.includes(',')
        ? process.env.CORS_ORIGINS.split(',')
        : process.env.CORS_ORIGINS
      : undefined,

    // smtp
    SMTP_HOST: process.env.SMTP_HOST as string,
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER as string,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD as string,
    ADMIN_MAIL: process.env.ADMIN_MAIL as string,

    DEFAULT_PASS: process.env.DEFAULT_PASS as string,
  };
}

export const appConfig = getAppConfig();
