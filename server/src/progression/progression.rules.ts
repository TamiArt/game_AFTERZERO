import type { ResourceAmounts } from '../game/game.rules.js';

export interface QuestRule {
  minimumLevel: number;
  required: number;
  rewardItems?: string[];
  rewardResources?: Partial<ResourceAmounts>;
  rewardXp: number;
}

export const QUEST_RULES: Record<string, QuestRule> = {
  q_collect: {
    minimumLevel: 1,
    required: 3,
    rewardXp: 40,
    rewardResources: { wood: 20 },
  },
  q_build: { minimumLevel: 1, required: 1, rewardXp: 50 },
  q_ruins: {
    minimumLevel: 1,
    required: 2,
    rewardXp: 30,
    rewardItems: ['i4'],
  },
  q_daily: {
    minimumLevel: 1,
    required: 5,
    rewardXp: 25,
    rewardResources: { energy: 15 },
  },
  q_stone: {
    minimumLevel: 2,
    required: 3,
    rewardXp: 45,
    rewardResources: { stone: 15 },
  },
  q_pet: {
    minimumLevel: 5,
    required: 1,
    rewardXp: 30,
    rewardItems: ['i12'],
  },
  q_visit: {
    minimumLevel: 2,
    required: 1,
    rewardXp: 60,
    rewardItems: ['i9'],
  },
  q_portal: {
    minimumLevel: 3,
    required: 3,
    rewardXp: 80,
    rewardItems: ['i7'],
  },
  q_builder: {
    minimumLevel: 3,
    required: 3,
    rewardXp: 70,
    rewardItems: ['i3'],
  },
};

export interface ProgressCounters {
  woodCollects: number;
  stoneCollects: number;
  dailyCollects: number;
  ruinsVisits: number;
  portalInteracts: number;
  totalBuilt: number;
  petCareCount: number;
  friendVisited: boolean;
}

export function questProgress(
  world: ProgressCounters,
): Record<string, number> {
  const resourceCollections = world.woodCollects + world.stoneCollects;
  return {
    q_collect: resourceCollections,
    q_daily: world.dailyCollects,
    q_stone: world.stoneCollects,
    q_build: world.totalBuilt,
    q_builder: world.totalBuilt,
    q_ruins: world.ruinsVisits,
    q_portal: world.portalInteracts,
    q_pet: world.petCareCount,
    q_visit: world.friendVisited ? 1 : 0,
  };
}

interface PetStats {
  hunger: number;
  mood: number;
  health: number;
  xp: number;
  level: number;
  lastUpdated: Date;
}

export const PET_OFFLINE_PROGRESS_CAP_MINUTES = 120;
export const MAX_PET_LEVEL = 10;
export const PET_OFFLINE_XP_PER_MINUTE = 1;

/**
 * Advance a pet during absence without degrading its care stats.
 * Offline XP is capped to two hours per absence; elapsed time beyond that cap
 * is discarded so repeatedly reopening the game cannot farm unlimited XP.
 */
export function advancePetOffline<T extends PetStats>(pet: T, now: Date): T {
  const elapsedMs = Math.max(0, now.getTime() - pet.lastUpdated.getTime());
  const elapsedMinutes = Math.min(
    PET_OFFLINE_PROGRESS_CAP_MINUTES,
    Math.floor(elapsedMs / 60_000),
  );
  if (elapsedMinutes < 1) return pet;

  let xp = pet.xp + elapsedMinutes * PET_OFFLINE_XP_PER_MINUTE;
  let level = pet.level;
  while (level < MAX_PET_LEVEL && xp >= petXpRequired(level)) {
    xp -= petXpRequired(level);
    level += 1;
  }
  if (level >= MAX_PET_LEVEL) xp = 0;

  const lastUpdated = elapsedMs > PET_OFFLINE_PROGRESS_CAP_MINUTES * 60_000
    ? now
    : new Date(pet.lastUpdated.getTime() + elapsedMinutes * 60_000);

  return { ...pet, xp, level, lastUpdated };
}

export function petXpRequired(level: number): number {
  return Math.floor(200 * Math.pow(1.5, level - 1));
}

export function uniqueItems(current: string[], additions: string[]): string[] {
  return [...new Set([...current, ...additions])];
}
