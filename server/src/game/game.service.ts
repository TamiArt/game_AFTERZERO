import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type {
  CollectResourceDto,
  StartBuildingDto,
} from './dto/game-action.dto.js';
import {
  addExperience,
  BUILDING_RULES,
  dailyReward,
  randomResourceAmount,
  RESOURCE_NODE_RULES,
  xpRequired,
  type ResourceAmounts,
} from './game.rules.js';
import type { GameSnapshot } from './game.types.js';
import {
  degradedPet,
  petXpRequired,
  questProgress,
  uniqueItems,
} from '../progression/progression.rules.js';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$extends' | '$on' | '$transaction' | '$use'
>;

const RESOURCE_COOLDOWN_MS = 30_000;
const PRODUCTION_INTERVAL_MS = 30_000;

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  getState(playerId: string): Promise<GameSnapshot> {
    return this.prisma.$transaction(async (transaction) => {
      await this.completeReadyBuildings(transaction, playerId, new Date());
      return this.snapshot(transaction, playerId);
    });
  }

  collect(
    playerId: string,
    input: CollectResourceDto,
  ): Promise<GameSnapshot> {
    return this.idempotent(playerId, input.requestId, 'collect', async (tx) => {
      const now = new Date();
      const world = await this.requireWorld(tx, playerId);
      const rule = RESOURCE_NODE_RULES[input.nodeId];
      if (!rule || world.level < rule.minimumLevel) {
        throw new BadRequestException('Resource node is not available');
      }

      const cooldown = await tx.resourceNodeCooldown.findUnique({
        where: {
          worldId_nodeKey: { worldId: world.id, nodeKey: input.nodeId },
        },
      });
      if (cooldown && cooldown.availableAt > now) {
        throw new ConflictException('Resource node is recharging');
      }

      const amount = randomResourceAmount(rule, Math.random());
      const experience = addExperience(world.level, world.xp, 20);
      const nextWoodCollects =
        world.woodCollects + (rule.resource === 'wood' ? 1 : 0);
      const isSameUtcDay =
        world.dailyProgressDate?.toISOString().slice(0, 10) ===
        now.toISOString().slice(0, 10);
      const discoveredItems =
        rule.resource === 'wood'
          ? nextWoodCollects >= 5
            ? ['i11', 'i2']
            : ['i11']
          : rule.resource === 'stone'
            ? ['i1']
            : [];
      await tx.world.update({
        where: { id: world.id },
        data: {
          ...experience,
          woodCollects:
            rule.resource === 'wood' ? { increment: 1 } : undefined,
          stoneCollects:
            rule.resource === 'stone' ? { increment: 1 } : undefined,
          dailyCollects: isSameUtcDay ? { increment: 1 } : 1,
          dailyProgressDate: now,
          foundItems: uniqueItems(world.foundItems, discoveredItems),
        },
      });
      await tx.resourceBalance.update({
        where: { worldId: world.id },
        data: { [rule.resource]: { increment: amount } },
      });
      await tx.resourceNodeCooldown.upsert({
        where: {
          worldId_nodeKey: { worldId: world.id, nodeKey: input.nodeId },
        },
        update: { availableAt: new Date(now.getTime() + RESOURCE_COOLDOWN_MS) },
        create: {
          worldId: world.id,
          nodeKey: input.nodeId,
          availableAt: new Date(now.getTime() + RESOURCE_COOLDOWN_MS),
        },
      });

      return this.snapshot(tx, playerId);
    });
  }

  startBuilding(
    playerId: string,
    input: StartBuildingDto,
  ): Promise<GameSnapshot> {
    return this.idempotent(playerId, input.requestId, 'build', async (tx) => {
      const world = await this.requireWorld(tx, playerId);
      const rule = BUILDING_RULES[input.type];
      if (!rule || world.level < rule.minimumLevel) {
        throw new BadRequestException('Building is not unlocked');
      }
      this.assertBuildableTile(input.tileC, input.tileR, world.level);

      const resources = world.resources;
      if (!resources || !this.canAfford(resources, rule.cost)) {
        throw new BadRequestException('Not enough resources');
      }

      const startedAt = new Date();
      try {
        await tx.building.create({
          data: {
            worldId: world.id,
            type: input.type,
            tileC: input.tileC,
            tileR: input.tileR,
            startedAt,
            completesAt: new Date(
              startedAt.getTime() + rule.durationSeconds * 1000,
            ),
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('Tile is already occupied');
        }
        throw error;
      }

      await tx.resourceBalance.update({
        where: { worldId: world.id },
        data: this.resourceDecrements(rule.cost),
      });
      const experience = addExperience(world.level, world.xp, 15);
      await tx.world.update({ where: { id: world.id }, data: experience });
      return this.snapshot(tx, playerId);
    });
  }

  completeBuilding(
    playerId: string,
    buildingId: string,
    requestId: string,
  ): Promise<GameSnapshot> {
    return this.idempotent(
      playerId,
      requestId,
      'complete-building',
      async (tx) => {
        const world = await this.requireWorld(tx, playerId);
        const building = await tx.building.findFirst({
          where: { id: buildingId, worldId: world.id },
        });
        if (!building) throw new NotFoundException('Building was not found');
        if (building.completedAt) return this.snapshot(tx, playerId);
        if (building.completesAt > new Date()) {
          throw new ConflictException('Building is not ready');
        }

        const completed = await tx.building.updateMany({
          where: { id: building.id, completedAt: null },
          data: { completedAt: new Date() },
        });
        if (completed.count === 0) return this.snapshot(tx, playerId);
        const experience = addExperience(world.level, world.xp, 40);
        const totalBuilt = world.totalBuilt + 1;
        await tx.world.update({
          where: { id: world.id },
          data: {
            ...experience,
            totalBuilt: { increment: 1 },
            foundItems:
              totalBuilt >= 2
                ? uniqueItems(world.foundItems, ['i9'])
                : world.foundItems,
          },
        });
        return this.snapshot(tx, playerId);
      },
    );
  }

  claimDaily(playerId: string, requestId: string): Promise<GameSnapshot> {
    return this.idempotent(playerId, requestId, 'daily', async (tx) => {
      const world = await this.requireWorld(tx, playerId);
      const today = this.utcDate(new Date());
      if (
        world.lastDailyClaimAt &&
        this.utcDate(world.lastDailyClaimAt) === today
      ) {
        throw new ConflictException('Daily reward was already claimed');
      }

      const reward = dailyReward(world.level);
      await tx.resourceBalance.update({
        where: { worldId: world.id },
        data: this.resourceIncrements(reward),
      });
      const experience = addExperience(world.level, world.xp, 80);
      await tx.world.update({
        where: { id: world.id },
        data: { ...experience, lastDailyClaimAt: new Date() },
      });
      return this.snapshot(tx, playerId);
    });
  }

  claimProduction(playerId: string, requestId: string): Promise<GameSnapshot> {
    return this.idempotent(playerId, requestId, 'production', async (tx) => {
      const now = new Date();
      const world = await this.requireWorld(tx, playerId);
      const periods = Math.min(
        120,
        Math.floor(
          (now.getTime() - world.lastProductionAt.getTime()) /
            PRODUCTION_INTERVAL_MS,
        ),
      );
      if (periods < 1) return this.snapshot(tx, playerId);

      const completedBuildings = await tx.building.groupBy({
        by: ['type'],
        where: { worldId: world.id, completedAt: { not: null } },
        _count: { type: true },
      });
      const production: ResourceAmounts = {
        wood: 0,
        stone: 0,
        metal: 0,
        energy: 0,
      };
      for (const building of completedBuildings) {
        if (building.type === 'garden') {
          production.energy += building._count.type * 2 * periods;
        }
        if (building.type === 'farm') {
          production.stone += building._count.type * periods;
        }
        if (building.type === 'workshop') {
          production.metal += building._count.type * periods;
        }
      }

      await tx.resourceBalance.update({
        where: { worldId: world.id },
        data: this.resourceIncrements(production),
      });
      await tx.world.update({
        where: { id: world.id },
        data: {
          lastProductionAt: new Date(
            world.lastProductionAt.getTime() +
              periods * PRODUCTION_INTERVAL_MS,
          ),
        },
      });
      return this.snapshot(tx, playerId);
    });
  }

  private async idempotent(
    playerId: string,
    key: string,
    kind: string,
    operation: (transaction: TransactionClient) => Promise<GameSnapshot>,
  ): Promise<GameSnapshot> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
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
              return previous.response as unknown as GameSnapshot;
            }

            const response = await operation(transaction);
            await transaction.gameAction.create({
              data: {
                playerId,
                key,
                kind,
                response: response as unknown as Prisma.InputJsonValue,
              },
            });
            return response;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
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
            return previous.response as unknown as GameSnapshot;
          }
        }
        if (
          !(
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2034' &&
            attempt < 2
          )
        ) {
          throw error;
        }
      }
    }
    throw new ConflictException('Action could not be completed');
  }

  private async snapshot(
    transaction: TransactionClient,
    playerId: string,
  ): Promise<GameSnapshot> {
    const world = await this.requireWorld(transaction, playerId);
    const pet = world.pet
      ? degradedPet(world.pet, new Date())
      : {
          name: 'Нокс',
          species: 'Лисица-призрак',
          level: 1,
          xp: 0,
          hunger: 80,
          mood: 75,
          health: 90,
          lastUpdated: new Date(),
        };
    const foundItems =
      world.level >= 3
        ? uniqueItems(world.foundItems, ['i3'])
        : world.foundItems;
    const cooldowns = await transaction.resourceNodeCooldown.findMany({
      where: { worldId: world.id, availableAt: { gt: new Date() } },
    });
    return {
      world: {
        id: world.id,
        name: world.name,
        level: world.level,
        xp: world.xp,
        xpNext: xpRequired(world.level),
        lastDailyDate: world.lastDailyClaimAt
          ? this.utcDate(world.lastDailyClaimAt)
          : '',
        resources: {
          wood: world.resources?.wood ?? 0,
          stone: world.resources?.stone ?? 0,
          metal: world.resources?.metal ?? 0,
          energy: world.resources?.energy ?? 0,
        },
        buildings: world.buildings.map((building) => ({
          id: building.id,
          type: building.type,
          tileC: building.tileC,
          tileR: building.tileR,
          startedAt: building.startedAt.getTime(),
          durationSec: Math.ceil(
            (building.completesAt.getTime() - building.startedAt.getTime()) /
              1000,
          ),
          endsAt: building.completedAt
            ? null
            : building.completesAt.getTime(),
        })),
        collectCooldowns: Object.fromEntries(
          cooldowns.map((cooldown) => [
            cooldown.nodeKey,
            cooldown.availableAt.getTime(),
          ]),
        ),
        woodCollects: world.woodCollects,
        stoneCollects: world.stoneCollects,
        ruinsVisits: world.ruinsVisits,
        portalInteracts: world.portalInteracts,
        totalBuilt: world.totalBuilt,
        petCareCount: world.petCareCount,
        friendVisited: world.friendVisited,
        questProgress: questProgress(world),
        claimedQuests: world.claimedQuests.flatMap((quest) => {
          if (!quest.includes(':')) return [quest];
          return quest === `q_daily:${new Date().toISOString().slice(0, 10)}`
            ? ['q_daily']
            : [];
        }),
        foundItems,
        pet: {
          name: pet.name,
          species: pet.species,
          level: pet.level,
          xp: pet.xp,
          xpNext: petXpRequired(pet.level),
          hunger: pet.hunger,
          mood: pet.mood,
          health: pet.health,
          lastUpdated: pet.lastUpdated.getTime(),
          discovered: world.level >= 2,
        },
      },
    };
  }

  private requireWorld(transaction: TransactionClient, playerId: string) {
    return transaction.world
      .findFirst({
        where: { ownerId: playerId },
        include: { resources: true, buildings: true, pet: true },
      })
      .then((world) => {
        if (!world) throw new NotFoundException('World was not found');
        return world;
      });
  }

  private async completeReadyBuildings(
    transaction: TransactionClient,
    playerId: string,
    now: Date,
  ): Promise<void> {
    const world = await this.requireWorld(transaction, playerId);
    const completed = await transaction.building.updateMany({
      where: {
        worldId: world.id,
        completedAt: null,
        completesAt: { lte: now },
      },
      data: { completedAt: now },
    });
    if (completed.count === 0) return;

    const experience = addExperience(world.level, world.xp, completed.count * 40);
    const totalBuilt = world.totalBuilt + completed.count;
    await transaction.world.update({
      where: { id: world.id },
      data: {
        ...experience,
        totalBuilt: { increment: completed.count },
        foundItems:
          totalBuilt >= 2
            ? uniqueItems(world.foundItems, ['i9'])
            : world.foundItems,
      },
    });
  }

  private canAfford(
    resources: ResourceAmounts,
    cost: Partial<ResourceAmounts>,
  ): boolean {
    return (Object.keys(cost) as Array<keyof ResourceAmounts>).every(
      (resource) => resources[resource] >= (cost[resource] ?? 0),
    );
  }

  private resourceDecrements(cost: Partial<ResourceAmounts>) {
    return Object.fromEntries(
      Object.entries(cost).map(([resource, amount]) => [
        resource,
        { decrement: amount },
      ]),
    );
  }

  private resourceIncrements(amounts: ResourceAmounts) {
    return Object.fromEntries(
      Object.entries(amounts).map(([resource, amount]) => [
        resource,
        { increment: amount },
      ]),
    );
  }

  private assertBuildableTile(c: number, r: number, level: number): void {
    const maps: Record<number, number[][]> = {
      1: [[2, 3], [3, 3], [4, 3], [3, 2], [3, 4]],
      2: [
        [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
        [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [1, 4], [2, 4], [3, 4],
        [4, 4], [2, 5], [3, 5],
      ],
      3: [
        [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [2, 2], [3, 2],
        [4, 2], [5, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [1, 4],
        [2, 4], [3, 4], [4, 4], [5, 4], [2, 5], [3, 5], [4, 5],
      ],
    };
    const availableTiles = maps[Math.min(level, 3)] ?? maps[3];
    if (!availableTiles.some(([tileC, tileR]) => tileC === c && tileR === r)) {
      throw new BadRequestException('Tile is not buildable');
    }
  }

  private utcDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
