import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
  it('rejects reusing a quest request key for a different quest', async () => {
    const service = createService({ kind: 'quest:q_collect' });
    const operation = vi.fn().mockResolvedValue(undefined);

    await expect(run(service, 'quest:q_build', operation)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(operation).not.toHaveBeenCalled();
  });

  it('retries a progression action after a serializable transaction conflict', async () => {
    const serializationError = new Prisma.PrismaClientKnownRequestError(
      'Serialization failure',
      { code: 'P2034', clientVersion: 'test' },
    );
    const transaction = {
      gameAction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(undefined),
      },
    };
    const prisma = {
      $transaction: vi
        .fn()
        .mockRejectedValueOnce(serializationError)
        .mockImplementationOnce(
          async (callback: (client: typeof transaction) => Promise<unknown>) =>
            callback(transaction),
        ),
    } as unknown as PrismaService;
    const service = new ProgressionService(prisma, {} as GameService);
    const operation = vi.fn().mockResolvedValue(undefined);

    await expect(run(service, 'collection', operation)).resolves.toBeUndefined();

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    expect(prisma.$transaction).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    expect(operation).toHaveBeenCalledTimes(1);
    expect(transaction.gameAction.create).toHaveBeenCalledWith({
      data: {
        playerId: 'player-1',
        key: 'request-1',
        kind: 'collection',
        response: { ok: true },
      },
    });
  });

  it('keeps pet actions locked until level five', async () => {
    const transaction = {
      gameAction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      world: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'world-1',
          level: 4,
          xp: 0,
          petCareCount: 0,
          foundItems: ['i8'],
          resources: { wood: 40, stone: 0, metal: 0, energy: 50 },
          pet: { worldId: 'world-1', hunger: 70, mood: 75, health: 90, xp: 0, level: 1, lastUpdated: new Date() },
        }),
        update: vi.fn(),
      },
      pet: { update: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof transaction) => Promise<unknown>) => callback(transaction)),
    } as unknown as PrismaService;
    const service = new ProgressionService(prisma, {} as GameService);

    await expect(service.petAction('player-1', {
      requestId: 'request-pet-before-unlock',
      action: 'play',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.pet.update).not.toHaveBeenCalled();
  });

  it('rejects feeding a pet that is already sufficiently full', async () => {
    const transaction = {
      gameAction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      world: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'world-1',
          level: 5,
          xp: 0,
          petCareCount: 0,
          foundItems: ['i8'],
          resources: { wood: 40, stone: 0, metal: 0, energy: 50 },
          pet: {
            worldId: 'world-1',
            hunger: 99,
            mood: 75,
            health: 90,
            xp: 0,
            level: 1,
            lastUpdated: new Date(),
          },
        }),
        update: vi.fn(),
      },
      pet: { update: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService;
    const service = new ProgressionService(prisma, {} as GameService);

    await expect(
      service.petAction('player-1', {
        requestId: 'request-feed-full-pet',
        action: 'feed',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction.pet.update).not.toHaveBeenCalled();
    expect(transaction.world.update).not.toHaveBeenCalled();
    expect(transaction.gameAction.create).not.toHaveBeenCalled();
  });

  it('rejects resting a pet that is already sufficiently healthy', async () => {
    const transaction = {
      gameAction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      world: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'world-1',
          // Pet actions are only available after the level-five unlock.
          // Keep this fixture unlocked so the test reaches the health conflict.
          level: 5,
          xp: 0,
          petCareCount: 0,
          foundItems: ['i8'],
          resources: { wood: 40, stone: 0, metal: 0, energy: 50 },
          pet: {
            worldId: 'world-1',
            hunger: 70,
            mood: 75,
            health: 99,
            xp: 0,
            level: 1,
            lastUpdated: new Date(),
          },
        }),
        update: vi.fn(),
      },
      pet: { update: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService;
    const service = new ProgressionService(prisma, {} as GameService);

    await expect(
      service.petAction('player-1', {
        requestId: 'request-rest-healthy-pet',
        action: 'rest',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction.pet.update).not.toHaveBeenCalled();
    expect(transaction.world.update).not.toHaveBeenCalled();
    expect(transaction.gameAction.create).not.toHaveBeenCalled();
  });

  it('does not grant a quest reward when another claim wins during retry', async () => {
    const serializationError = new Prisma.PrismaClientKnownRequestError(
      'Serialization failure',
      { code: 'P2034', clientVersion: 'test' },
    );
    const world = {
      id: 'world-1',
      level: 1,
      xp: 0,
      resources: { wood: 10, stone: 0, metal: 0, energy: 10 },
      claimedQuests: [] as string[],
      foundItems: [],
      woodCollects: 3,
      stoneCollects: 0,
      dailyCollects: 0,
      ruinsVisits: 0,
      portalInteracts: 0,
      totalBuilt: 0,
      petCareCount: 0,
      friendVisited: false,
      pet: null,
    };
    const transactionClient = {
      gameAction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      world: {
        findFirst: vi.fn().mockImplementation(async () => world),
        update: vi.fn(),
      },
      resourceBalance: { update: vi.fn() },
    };
    const transaction = vi
      .fn()
      .mockImplementationOnce(async () => {
        // Another request has claimed the quest while this serializable
        // transaction is aborted and prepared for retry.
        world.claimedQuests = ['q_collect'];
        throw serializationError;
      })
      .mockImplementationOnce(
        async (callback: (client: typeof transactionClient) => Promise<unknown>) =>
          callback(transactionClient),
      );
    const prisma = {
      $transaction: transaction,
      gameAction: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new ProgressionService(prisma, {} as GameService);

    await expect(
      service.claimQuest('player-1', {
        requestId: 'quest-race-retry',
        questId: 'q_collect',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transactionClient.world.update).not.toHaveBeenCalled();
    expect(transactionClient.resourceBalance.update).not.toHaveBeenCalled();
    expect(transactionClient.gameAction.create).not.toHaveBeenCalled();
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
