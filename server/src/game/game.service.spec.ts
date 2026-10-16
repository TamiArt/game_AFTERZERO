import { ConflictException } from '@nestjs/common';
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
});
