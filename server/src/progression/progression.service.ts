import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { addExperience } from '../game/game.rules.js';
import { GameService } from '../game/game.service.js';
import type { GameSnapshot } from '../game/game.types.js';
import type {
  ClaimQuestDto,
  PetActionDto,
  WorldInteractionDto,
} from './dto/progression-action.dto.js';
import {
  degradedPet,
  petXpRequired,
  QUEST_RULES,
  questProgress,
  uniqueItems,
} from './progression.rules.js';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$extends' | '$on' | '$transaction' | '$use'
>;

const EXPLORABLE_ITEMS = ['i1', 'i2', 'i3', 'i4', 'i6', 'i7', 'i8', 'i9', 'i11', 'i12'];

@Injectable()
export class ProgressionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly game: GameService,
  ) {}

  async claimQuest(
    playerId: string,
    input: ClaimQuestDto,
  ): Promise<GameSnapshot> {
    await this.runAction(
      playerId,
      input.requestId,
      `quest:${input.questId}`,
      async (tx) => {
      const world = await this.requireWorld(tx, playerId);
      const rule = QUEST_RULES[input.questId];
      if (!rule || world.level < rule.minimumLevel) {
        throw new BadRequestException('Quest is not available');
      }

      const claimKey =
        input.questId === 'q_daily'
          ? `${input.questId}:${new Date().toISOString().slice(0, 10)}`
          : input.questId;
      if (world.claimedQuests.includes(claimKey)) {
        throw new ConflictException('Quest reward was already claimed');
      }
      const progress = questProgress(world)[input.questId] ?? 0;
      if (progress < rule.required) {
        throw new BadRequestException('Quest is not complete');
      }

      const experience = addExperience(world.level, world.xp, rule.rewardXp);
      await tx.world.update({
        where: { id: world.id },
        data: {
          ...experience,
          claimedQuests: [...world.claimedQuests, claimKey],
          foundItems: uniqueItems(world.foundItems, rule.rewardItems ?? []),
        },
      });
      if (rule.rewardResources) {
        await tx.resourceBalance.update({
          where: { worldId: world.id },
          data: Object.fromEntries(
            Object.entries(rule.rewardResources).map(([resource, amount]) => [
              resource,
              { increment: amount },
            ]),
          ),
        });
      }
    });
    return this.game.getState(playerId);
  }

  async exploreCollection(
    playerId: string,
    requestId: string,
  ): Promise<GameSnapshot> {
    await this.runAction(playerId, requestId, 'collection', async (tx) => {
      const world = await this.requireWorld(tx, playerId);
      if (!world.resources || world.resources.energy < 10) {
        throw new BadRequestException('Not enough energy');
      }
      const available = EXPLORABLE_ITEMS.filter(
        (item) =>
          !world.foundItems.includes(item) &&
          !(item === 'i3' && world.level >= 3),
      );
      if (available.length === 0) {
        throw new ConflictException('All available items were discovered');
      }

      const item = available[randomInt(available.length)];
      // The earlier balance check gives a friendly error, but another
      // request may spend energy before this transaction reaches the debit.
      // Keep the balance invariant in the write itself.
      const debit = await tx.resourceBalance.updateMany({
        where: { worldId: world.id, energy: { gte: 10 } },
        data: { energy: { decrement: 10 } },
      });
      if (debit.count !== 1) {
        throw new BadRequestException('Not enough energy');
      }
      await tx.world.update({
        where: { id: world.id },
        data: { foundItems: [...world.foundItems, item] },
      });
    });
    return this.game.getState(playerId);
  }

  async interact(
    playerId: string,
    input: WorldInteractionDto,
  ): Promise<GameSnapshot> {
    await this.runAction(playerId, input.requestId, input.action, async (tx) => {
      const world = await this.requireWorld(tx, playerId);
      const isRuins = input.action === 'ruins';
      const nextCount = isRuins
        ? world.ruinsVisits + 1
        : world.portalInteracts + 1;
      const unlockedItem =
        isRuins && nextCount >= 2
          ? 'i4'
          : !isRuins && nextCount >= 3
            ? 'i7'
            : null;
      const experience = addExperience(
        world.level,
        world.xp,
        isRuins ? 25 : 30,
      );
      await tx.world.update({
        where: { id: world.id },
        data: {
          ...experience,
          [isRuins ? 'ruinsVisits' : 'portalInteracts']: { increment: 1 },
          foundItems: unlockedItem
            ? uniqueItems(world.foundItems, [unlockedItem])
            : world.foundItems,
        },
      });
    });
    return this.game.getState(playerId);
  }

  async petAction(
    playerId: string,
    input: PetActionDto,
  ): Promise<GameSnapshot> {
    await this.runAction(playerId, input.requestId, `pet-${input.action}`, async (tx) => {
      const world = await this.requireWorld(tx, playerId);
      if (world.level < 2 || !world.pet) {
        throw new BadRequestException('Pet is not discovered');
      }

      const now = new Date();
      const pet = degradedPet(world.pet, now);
      // Enforce the same useful-action thresholds on the server as the UI.
      // Client-side disabled buttons are not a security or progression guard.
      if (input.action === 'feed' && pet.hunger >= 95) {
        throw new ConflictException('Pet does not need feeding yet');
      }
      if (input.action === 'rest' && pet.health >= 95) {
        throw new ConflictException('Pet does not need rest yet');
      }

      let hunger = pet.hunger;
      let mood = pet.mood;
      let health = pet.health;
      let petXp = pet.xp;
      let petLevel = pet.level;
      let worldXp = 0;

      if (input.action === 'feed') {
        hunger = Math.min(100, hunger + 35);
        mood = hunger > 75 ? Math.min(100, mood + 5) : mood;
        worldXp = 8;
      } else if (input.action === 'play') {
        mood = Math.min(100, mood + 30);
        hunger = Math.max(0, hunger - 8);
        petXp += 25;
        if (petLevel < 10 && petXp >= petXpRequired(petLevel)) {
          petXp -= petXpRequired(petLevel);
          petLevel += 1;
        }
        worldXp = 12;
      } else {
        health = Math.min(100, health + 20);
      }

      await tx.pet.update({
        where: { worldId: world.id },
        data: {
          hunger,
          mood,
          health,
          xp: petXp,
          level: petLevel,
          lastUpdated: now,
        },
      });
      const experience = addExperience(world.level, world.xp, worldXp);
      await tx.world.update({
        where: { id: world.id },
        data: {
          ...experience,
          petCareCount:
            input.action === 'feed' ? { increment: 1 } : undefined,
          foundItems:
            input.action === 'feed'
              ? uniqueItems(world.foundItems, ['i12'])
              : world.foundItems,
        },
      });
    });
    return this.game.getState(playerId);
  }

  private async runAction(
    playerId: string,
    key: string,
    kind: string,
    operation: (transaction: TransactionClient) => Promise<void>,
  ): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.prisma.$transaction(
          async (transaction) => {
            const previous = await transaction.gameAction.findUnique({
              where: { playerId_key: { playerId, key } },
            });
            if (previous) {
              if (previous.kind !== kind) {
                throw new ConflictException(
                  'Request ID was already used for a different action',
                );
              }
              return;
            }
            await operation(transaction);
            await transaction.gameAction.create({
              data: { playerId, key, kind, response: { ok: true } },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        return;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const previous = await this.prisma.gameAction.findUnique({
            where: { playerId_key: { playerId, key } },
          });
          if (previous) {
            if (previous.kind !== kind) {
              throw new ConflictException(
                'Request ID was already used for a different action',
              );
            }
            return;
          }
          throw error;
        }

        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';
        if (!retryable || attempt === 2) throw error;
      }
    }
  }

  private requireWorld(transaction: TransactionClient, playerId: string) {
    return transaction.world
      .findFirst({
        where: { ownerId: playerId },
        include: { resources: true, pet: true },
      })
      .then((world) => {
        if (!world) throw new NotFoundException('World was not found');
        return world;
      });
  }
}
