import { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../database/prisma.service.js';
import { AuthService } from './auth.service.js';
import {
  TelegramInitDataService,
  type VerifiedTelegramUser,
} from './telegram-init-data.service.js';

describe('AuthService', () => {
  it('upserts the player and creates a starter world idempotently', async () => {
    const telegramUser: VerifiedTelegramUser = {
      id: 123456789,
      first_name: 'Aris',
      username: 'aris_zero',
    };
    const player = {
      id: 'player-id',
      telegramId: BigInt(telegramUser.id),
      firstName: telegramUser.first_name,
      username: telegramUser.username,
    };
    const world = {
      id: 'world-id',
      name: 'Остров Aris',
      level: 1,
      xp: 0,
      resources: { wood: 40, stone: 0, metal: 0, energy: 50 },
    };
    const transaction = {
      player: { upsert: vi.fn().mockResolvedValue(player) },
      world: { upsert: vi.fn().mockResolvedValue(world) },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService;
    const telegramInitData = {
      verify: vi.fn().mockReturnValue(telegramUser),
    } as unknown as TelegramInitDataService;
    const jwt = {
      signAsync: vi.fn().mockResolvedValue('signed-access-token'),
    } as unknown as JwtService;

    const result = await new AuthService(
      prisma,
      telegramInitData,
      jwt,
    ).loginWithTelegram('signed-init-data');

    expect(transaction.player.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { telegramId: BigInt(telegramUser.id) },
      }),
    );
    expect(transaction.world.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: player.id },
        create: expect.objectContaining({ resources: { create: {} } }),
      }),
    );
    expect(result).toMatchObject({
      accessToken: 'signed-access-token',
      player: { id: player.id, telegramId: String(telegramUser.id) },
      world,
    });
  });
});
