export interface GameSnapshot {
  world: {
    id: string;
    name: string;
    level: number;
    xp: number;
    xpNext: number;
    lastDailyDate: string;
    resources: {
      wood: number;
      stone: number;
      metal: number;
      energy: number;
    };
    buildings: Array<{
      id: string;
      type: string;
      tileC: number;
      tileR: number;
      startedAt: number;
      durationSec: number;
      endsAt: number | null;
    }>;
    collectCooldowns: Record<string, number>;
    woodCollects: number;
    stoneCollects: number;
    ruinsVisits: number;
    portalInteracts: number;
    totalBuilt: number;
    petCareCount: number;
    friendVisited: boolean;
    questProgress: Record<string, number>;
    claimedQuests: string[];
    foundItems: string[];
    pet: {
      name: string;
      species: string;
      level: number;
      xp: number;
      xpNext: number;
      hunger: number;
      mood: number;
      health: number;
      lastUpdated: number;
      discovered: boolean;
    };
  };
}
