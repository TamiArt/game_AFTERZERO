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
    minimumLevel: 2,
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
  lastUpdated: Date;
}

export function degradedPet<T extends PetStats>(pet: T, now: Date): T {
  const minutes = Math.max(
    0,
    (now.getTime() - pet.lastUpdated.getTime()) / 60_000,
  );
  return {
    ...pet,
    hunger: Math.max(0, pet.hunger - minutes * 3),
    mood: Math.max(0, pet.mood - minutes * 1.5),
    health: Math.max(0, pet.health - minutes * 0.3),
    lastUpdated: now,
  };
}

export function petXpRequired(level: number): number {
  return Math.floor(200 * Math.pow(1.5, level - 1));
}

export function uniqueItems(current: string[], additions: string[]): string[] {
  return [...new Set([...current, ...additions])];
}
