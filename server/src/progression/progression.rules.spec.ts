import { describe, expect, it } from 'vitest';
import {
  degradedPet,
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

  it('degrades pet stats according to elapsed server time', () => {
    const lastUpdated = new Date('2026-01-01T00:00:00.000Z');
    const pet = degradedPet(
      { hunger: 80, mood: 75, health: 90, lastUpdated },
      new Date('2026-01-01T00:10:00.000Z'),
    );

    expect(pet).toMatchObject({ hunger: 50, mood: 60, health: 87 });
  });

  it('adds collection items without duplicates', () => {
    expect(uniqueItems(['i8', 'i1'], ['i1', 'i2'])).toEqual([
      'i8',
      'i1',
      'i2',
    ]);
  });
});
