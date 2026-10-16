import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;
const MAX_FUTURE_CLOCK_SKEW_SECONDS = 60;

export interface VerifiedTelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

@Injectable()
export class TelegramInitDataService {
  private readonly botToken: string;

  constructor(config: ConfigService) {
    this.botToken = config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
  }

  verify(initData: string, now = new Date()): VerifiedTelegramUser {
    const parameters = new URLSearchParams(initData);
    const receivedHash = parameters.get('hash');
    if (!receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) {
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }

    parameters.delete('hash');
    const dataCheckString = [...parameters.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();
    const expectedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest();
    const receivedHashBuffer = Buffer.from(receivedHash, 'hex');

    if (
      receivedHashBuffer.length !== expectedHash.length ||
      !timingSafeEqual(receivedHashBuffer, expectedHash)
    ) {
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }

    this.assertFresh(parameters.get('auth_date'), now);
    return this.parseUser(parameters.get('user'));
  }

  private assertFresh(authDateValue: string | null, now: Date): void {
    const authDate = Number(authDateValue);
    const nowSeconds = Math.floor(now.getTime() / 1000);
    const ageSeconds = nowSeconds - authDate;

    if (
      !Number.isInteger(authDate) ||
      ageSeconds > MAX_AUTH_AGE_SECONDS ||
      ageSeconds < -MAX_FUTURE_CLOCK_SKEW_SECONDS
    ) {
      throw new UnauthorizedException('Telegram authentication data has expired');
    }
  }

  private parseUser(value: string | null): VerifiedTelegramUser {
    try {
      const user = JSON.parse(value ?? '') as Partial<VerifiedTelegramUser>;
      if (
        !Number.isSafeInteger(user.id) ||
        typeof user.first_name !== 'string' ||
        user.first_name.length === 0
      ) {
        throw new Error('Malformed user');
      }
      return user as VerifiedTelegramUser;
    } catch {
      throw new UnauthorizedException('Invalid Telegram user data');
    }
  }
}
