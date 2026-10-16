import { ConflictException } from '@nestjs/common';
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
});
