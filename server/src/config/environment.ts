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

function parseWebAppOrigin(value: unknown, nodeEnvironment: string): string {
  const origin = String(value ?? '');
  let parsed: URL;

  try {
    parsed = new URL(origin);
  } catch {
    throw new Error('WEB_APP_ORIGIN must be a valid absolute URL');
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== '/' && parsed.pathname !== '') ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('WEB_APP_ORIGIN must contain only an HTTP(S) origin');
  }

  if (nodeEnvironment === 'production' && parsed.protocol !== 'https:') {
    throw new Error('WEB_APP_ORIGIN must use HTTPS in production');
  }

  return parsed.origin;
}

function validateDatabaseUrl(value: unknown): string {
  const databaseUrl = String(value ?? '');
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }

  if (
    !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    !parsed.pathname ||
    parsed.pathname === '/'
  ) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }

  return databaseUrl;
}

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
    DATABASE_URL: validateDatabaseUrl(config.DATABASE_URL),
    JWT_SECRET: jwtSecret,
    NODE_ENV: nodeEnvironment as Environment['NODE_ENV'],
    TELEGRAM_BOT_TOKEN: String(config.TELEGRAM_BOT_TOKEN),
    WEB_APP_ORIGIN: parseWebAppOrigin(config.WEB_APP_ORIGIN, nodeEnvironment),
  };
}
