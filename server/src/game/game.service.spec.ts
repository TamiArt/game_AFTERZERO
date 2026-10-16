import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../database/prisma.service.js';
import { GameService } from './game.service.js';

function createService(previous: { kind: string; response: unknown } | null) {
  const transaction = {
    gameAction: {
      findUnique: vi.fn().mockResolvedValue(previous),
    },
  };
  const prisma = {
    $transaction: vi.fn(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  } as unknown as PrismaService;

  return new GameService(prisma);
}

type IdempotentRunner = {
  idempotent(
    playerId: string,
    key: string,
    kind: string,
    operation: () => Promise<unknown>,
  ): Promise<unknown>;
};

function runIdempotent(service: GameService, kind: string) {
  return (service as unknown as IdempotentRunner).idempotent(
    'player-1',
    'request-1',
    kind,
    vi.fn(),
  );
}

describe('GameService idempotency', () => {
  it('replays a prior response when the request ID and action type match', async () => {
    const snapshot = { world: { id: 'world-1' } };
    const service = createService({ kind: 'build', response: snapshot });

    await expect(runIdempotent(service, 'build')).resolves.toEqual(snapshot);
  });

  it('rejects reusing a request ID for a different action type', async () => {
    const service = createService({
      kind: 'collect',
      response: { world: { id: 'world-1' } },
    });

    await expect(runIdempotent(service, 'build')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('retries world-state reads after a serializable transaction conflict', async () => {
    const serializationError = new Prisma.PrismaClientKnownRequestError(
      'Serialization failure',
      { code: 'P2034', clientVersion: 'test' },
    );
    const finalError = new Error('second transaction failed');
    const transaction = vi
      .fn()
      .mockRejectedValueOnce(serializationError)
      .mockRejectedValueOnce(finalError);
    const prisma = {
      $transaction: transaction,
    } as unknown as PrismaService;
    const service = new GameService(prisma);

    await expect(service.getState('player-1')).rejects.toBe(finalError);

    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    expect(transaction).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  });

  it('does not debit a building when the atomic balance guard fails', async () => {
    const transaction = {
      gameAction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      world: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'world-1',
          level: 1,
          xp: 0,
          resources: { wood: 40, stone: 0, metal: 0, energy: 50 },
          buildings: [],
          pet: null,
          foundItems: ['i8'],
        }),
      },
      building: {
        create: vi.fn().mockResolvedValue({ id: 'building-1' }),
      },
      resourceBalance: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService;
    const service = new GameService(prisma);

    await expect(
      service.startBuilding('player-1', {
        requestId: '11111111-1111-4111-8111-111111111111',
        type: 'garden',
        tileC: 2,
        tileR: 3,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction.resourceBalance.updateMany).toHaveBeenCalledWith({
      where: { worldId: 'world-1', wood: { gte: 30 } },
      data: { wood: { decrement: 30 } },
    });
    expect(transaction.world.findFirst).toHaveBeenCalledTimes(1);
    expect(transaction.gameAction.create).not.toHaveBeenCalled();
  });

});
