export type ResourceKey = 'wood' | 'stone' | 'metal' | 'energy';

export interface ResourceAmounts {
  wood: number;
  stone: number;
  metal: number;
  energy: number;
}

export interface BuildingRule {
  cost: Partial<ResourceAmounts>;
  durationSeconds: number;
  minimumLevel: number;
}

export const BUILDING_RULES: Record<string, BuildingRule> = {
  house: {
    cost: { wood: 50, stone: 20 },
    durationSeconds: 15,
    minimumLevel: 1,
  },
  garden: {
    cost: { wood: 30 },
    durationSeconds: 10,
    minimumLevel: 1,
  },
  workshop: {
    cost: { wood: 80, stone: 20 },
    durationSeconds: 25,
    minimumLevel: 2,
  },
  farm: {
    cost: { wood: 60, stone: 30 },
    durationSeconds: 20,
    minimumLevel: 2,
  },
  lab: {
    cost: { stone: 60, metal: 40 },
    durationSeconds: 90,
    minimumLevel: 8,
  },
  observatory: {
    cost: { stone: 100, metal: 60, energy: 40 },
    durationSeconds: 120,
    minimumLevel: 10,
  },
};

interface ResourceNodeRule {
  maximum: number;
  minimum: number;
  minimumLevel: number;
  resource: ResourceKey;
}

export const RESOURCE_NODE_RULES: Record<string, ResourceNodeRule> = {
  '2,3': { resource: 'wood', minimum: 10, maximum: 21, minimumLevel: 1 },
  '1,2': { resource: 'wood', minimum: 10, maximum: 21, minimumLevel: 2 },
  '4,2': { resource: 'stone', minimum: 5, maximum: 12, minimumLevel: 2 },
  '5,3': { resource: 'wood', minimum: 10, maximum: 21, minimumLevel: 3 },
  '4,4': { resource: 'metal', minimum: 2, maximum: 6, minimumLevel: 3 },
};

const LEVEL_XP = [0, 200, 300, 500, 800, 1200, 1800, 2600];

export function xpRequired(level: number): number {
  return LEVEL_XP[level] ?? Math.floor(800 * Math.pow(1.35, level - 1));
}

export function addExperience(
  level: number,
  xp: number,
  amount: number,
): { level: number; xp: number } {
  let nextLevel = level;
  let nextXp = xp + amount;

  while (nextLevel < 10 && nextXp >= xpRequired(nextLevel)) {
    nextXp -= xpRequired(nextLevel);
    nextLevel += 1;
  }

  return { level: nextLevel, xp: nextXp };
}

export function randomResourceAmount(
  rule: ResourceNodeRule,
  randomValue: number,
): number {
  const boundedRandom = Math.min(0.999999, Math.max(0, randomValue));
  return (
    rule.minimum +
    Math.floor(boundedRandom * (rule.maximum - rule.minimum + 1))
  );
}

export function dailyReward(level: number): ResourceAmounts {
  return {
    wood: 30 + level * 10,
    stone: level >= 2 ? 15 + level * 5 : 0,
    metal: 0,
    energy: 10 + level * 3,
  };
}
