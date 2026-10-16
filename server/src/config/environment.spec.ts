import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment.js';

function config(overrides: Record<string, unknown> = {}) {
  return {
    NODE_ENV: 'development',
    API_PORT: '3000',
    WEB_APP_ORIGIN: 'http://localhost:8443',
    DATABASE_URL: 'postgresql://afterzero:afterzero@localhost:5432/afterzero',
    TELEGRAM_BOT_TOKEN: 'test-token',
    JWT_SECRET: 'test-secret',
    ...overrides,
  };
}

describe('validateEnvironment', () => {
  it('normalizes a valid web app origin and accepts a PostgreSQL URL', () => {
    expect(validateEnvironment(config())).toMatchObject({
      API_PORT: 3000,
      WEB_APP_ORIGIN: 'http://localhost:8443',
      DATABASE_URL: 'postgresql://afterzero:afterzero@localhost:5432/afterzero',
      NODE_ENV: 'development',
    });
  });

  it('rejects non-HTTPS origins in production', () => {
    expect(() =>
      validateEnvironment(
        config({
          NODE_ENV: 'production',
          WEB_APP_ORIGIN: 'http://app.example.com',
          JWT_SECRET: 'a'.repeat(32),
        }),
      ),
    ).toThrow('WEB_APP_ORIGIN must use HTTPS in production');
  });

  it('rejects a web app URL that contains a path', () => {
    expect(() =>
      validateEnvironment({
        ...config(),
        WEB_APP_ORIGIN: 'https://app.example.com/game',
      }),
    ).toThrow('WEB_APP_ORIGIN must contain only an HTTP(S) origin');
  });

  it('rejects non-PostgreSQL database URLs', () => {
    expect(() =>
      validateEnvironment({
        ...config(),
        DATABASE_URL: 'https://database.example.com/afterzero',
      }),
    ).toThrow('DATABASE_URL must be a valid PostgreSQL connection URL');
  });

  it('rejects invalid API ports', () => {
    expect(() =>
      validateEnvironment({
        ...config(),
        API_PORT: '70000',
      }),
    ).toThrow('API_PORT must be a valid TCP port');
  });
});
