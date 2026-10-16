export interface Environment {
  API_PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  NODE_ENV: 'development' | 'test' | 'production';
  TELEGRAM_BOT_TOKEN: string;
  WEB_APP_ORIGIN: string;
}

const REQUIRED_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'WEB_APP_ORIGIN',
] as const;

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const missingKeys = REQUIRED_KEYS.filter((key) => !config[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Missing environment variables: ${missingKeys.join(', ')}`);
  }

  const nodeEnvironment = String(config.NODE_ENV ?? 'development');
  if (!['development', 'test', 'production'].includes(nodeEnvironment)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const jwtSecret = String(config.JWT_SECRET);
  if (nodeEnvironment === 'production' && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production');
  }

  const apiPort = Number(config.API_PORT ?? 3000);
  if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65_535) {
    throw new Error('API_PORT must be a valid TCP port');
  }

  return {
    API_PORT: apiPort,
    DATABASE_URL: String(config.DATABASE_URL),
    JWT_SECRET: jwtSecret,
    NODE_ENV: nodeEnvironment as Environment['NODE_ENV'],
    TELEGRAM_BOT_TOKEN: String(config.TELEGRAM_BOT_TOKEN),
    WEB_APP_ORIGIN: String(config.WEB_APP_ORIGIN),
  };
}
