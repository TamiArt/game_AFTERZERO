import { createHmac } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { TelegramInitDataService } from './telegram-init-data.service.js';

const BOT_TOKEN = '123456:test-token';
const NOW = new Date('2026-01-15T12:00:00.000Z');

function createInitData(
  overrides: Record<string, string> = {},
): string {
  const parameters = new URLSearchParams({
    auth_date: String(Math.floor(NOW.getTime() / 1000)),
    query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
    user: JSON.stringify({
      id: 123456789,
      first_name: 'Aris',
      username: 'aris_zero',
    }),
    ...overrides,
  });
  const dataCheckString = [...parameters.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();
  parameters.set(
    'hash',
    createHmac('sha256', secretKey).update(dataCheckString).digest('hex'),
  );
  return parameters.toString();
}

function createService(): TelegramInitDataService {
  return new TelegramInitDataService(
    new ConfigService({ TELEGRAM_BOT_TOKEN: BOT_TOKEN }),
  );
}

describe('TelegramInitDataService', () => {
  it('returns a user for correctly signed and fresh init data', () => {
    expect(createService().verify(createInitData(), NOW)).toMatchObject({
      id: 123456789,
      first_name: 'Aris',
      username: 'aris_zero',
    });
  });

  it('rejects a modified payload', () => {
    const initData = createInitData().replace('Aris', 'Attacker');

    expect(() => createService().verify(initData, NOW)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects expired init data', () => {
    const authDate = Math.floor(NOW.getTime() / 1000) - 86_401;

    expect(() =>
      createService().verify(
        createInitData({ auth_date: String(authDate) }),
        NOW,
      ),
    ).toThrow('Telegram authentication data has expired');
  });
});
