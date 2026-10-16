import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../database/prisma.service.js';
import { ProgressionService } from './progression.service.js';
import { GameService } from '../game/game.service.js';

function createService(previous: { kind: string } | null) {
  const transaction = {
    gameAction: {
      findUnique: vi.fn().mockResolvedValue(previous),
      create: vi.fn(),
    },
  };
  const prisma = {
    $transaction: vi.fn(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
    gameAction: {
      findUnique: vi.fn().mockResolvedValue(previous),
    },
  } as unknown as PrismaService;
  return new ProgressionService(prisma, {} as GameService);
}

type RunAction = {
  runAction(
    playerId: string,
    key: string,
    kind: string,
    operation: () => Promise<void>,
  ): Promise<void>;
};

function run(service: ProgressionService, kind: string, operation: () => Promise<void>) {
  return (service as unknown as RunAction).runAction(
    'player-1',
    'request-1',
    kind,
    operation,
  );
}

describe('ProgressionService idempotency', () => {
  it('does not execute an operation again when the action type matches', async () => {
    const service = createService({ kind: 'collection' });
    const operation = vi.fn().mockResolvedValue(undefined);

    await expect(run(service, 'collection', operation)).resolves.toBeUndefined();
    expect(operation).not.toHaveBeenCalled();
  });

  it('rejects reusing a request ID for a different progression action', async () => {
    const service = createService({ kind: 'ruins' });
    const operation = vi.fn().mockResolvedValue(undefined);

    await expect(run(service, 'portal', operation)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(operation).not.toHaveBeenCalled();
  });
  it('does not discover an item when the atomic energy guard fails', async () => {
    const transaction = {
      gameAction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      world: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'world-1',
          level: 1,
          resources: { energy: 10 },
          foundItems: ['i8'],
          pet: null,
        }),
        update: vi.fn(),
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
      gameAction: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;
    const service = new ProgressionService(prisma, {} as GameService);

    await expect(
      service.exploreCollection('player-1', 'request-collection-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction.resourceBalance.updateMany).toHaveBeenCalledWith({
      where: { worldId: 'world-1', energy: { gte: 10 } },
      data: { energy: { decrement: 10 } },
    });
    expect(transaction.world.update).not.toHaveBeenCalled();
    expect(transaction.gameAction.create).not.toHaveBeenCalled();
  });

});
