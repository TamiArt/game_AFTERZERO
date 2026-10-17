import { describe, expect, it } from 'vitest';
import {
  advancePetOffline,
  PET_OFFLINE_PROGRESS_CAP_MINUTES,
  QUEST_RULES,
  questProgress,
  uniqueItems,
} from './progression.rules.js';

describe('progression rules', () => {
  it('derives quest progress only from authoritative counters', () => {
    expect(
      questProgress({
        woodCollects: 3,
        stoneCollects: 2,
        dailyCollects: 5,
        ruinsVisits: 1,
        portalInteracts: 2,
        totalBuilt: 3,
        petCareCount: 1,
        friendVisited: true,
      }),
    ).toMatchObject({
      q_collect: 5,
      q_daily: 5,
      q_stone: 2,
      q_builder: 3,
      q_visit: 1,
    });
  });

  it('keeps the pet quest locked until the documented level-five milestone', () => {
    expect(QUEST_RULES.q_pet.minimumLevel).toBe(5);
  });

  it('defines valid level and completion requirements for every quest', () => {
    for (const [id, rule] of Object.entries(QUEST_RULES)) {
      expect(id).toMatch(/^q_/);
      expect(rule.minimumLevel).toBeGreaterThanOrEqual(1);
      expect(rule.minimumLevel).toBeLessThanOrEqual(30);
      expect(rule.required).toBeGreaterThan(0);
      expect(rule.rewardXp).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps pet care stats stable and grants offline XP', () => {
    const lastUpdated = new Date('2026-01-01T00:00:00.000Z');
    const pet = advancePetOffline(
      { hunger: 80, mood: 75, health: 90, xp: 0, level: 1, lastUpdated },
      new Date('2026-01-01T00:10:00.000Z'),
    );

    expect(pet).toMatchObject({ hunger: 80, mood: 75, health: 90, xp: 10, level: 1 });
    expect(pet.lastUpdated).toEqual(new Date('2026-01-01T00:10:00.000Z'));
  });

  it('caps pet offline progress and discards time beyond the cap', () => {
    const lastUpdated = new Date('2026-01-01T00:00:00.000Z');
    const pet = advancePetOffline(
      { hunger: 80, mood: 75, health: 90, xp: 0, level: 1, lastUpdated },
      new Date('2026-01-02T00:00:00.000Z'),
    );

    expect(pet.xp).toBe(PET_OFFLINE_PROGRESS_CAP_MINUTES);
    expect(pet.lastUpdated).toEqual(new Date('2026-01-02T00:00:00.000Z'));
  });

  it('adds collection items without duplicates', () => {
    expect(uniqueItems(['i8', 'i1'], ['i1', 'i2'])).toEqual([
      'i8',
      'i1',
      'i2',
    ]);
  });
});
