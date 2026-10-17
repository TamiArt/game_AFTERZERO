import { describe, expect, it } from 'vitest';
import {
  addExperience,
  dailyReward,
  randomResourceAmount,
  RESOURCE_NODE_RULES,
} from './game.rules.js';

describe('game rules', () => {
  it('carries XP through multiple levels without losing overflow', () => {
    expect(addExperience(1, 190, 330)).toEqual({ level: 3, xp: 20 });
  });

  it('supports all 30 levels and carries XP across several thresholds', () => {
    const result = addExperience(8, 0, 100_000);
    expect(result.level).toBe(30);
    expect(result.xp).toBe(0);
  });

  it('does not allow experience to push a capped player beyond level 30', () => {
    expect(addExperience(30, 0, 500)).toEqual({ level: 30, xp: 0 });
  });

  it('keeps XP thresholds defined and increasing through level 30', async () => {
    const { xpRequired } = await import('./game.rules.js');
    for (let level = 1; level < 30; level += 1) {
      expect(xpRequired(level + 1)).toBeGreaterThan(xpRequired(level));
    }
  });

  it('calculates level-scaled daily rewards', () => {
    expect(dailyReward(2)).toEqual({
      wood: 50,
      stone: 25,
      metal: 0,
      energy: 16,
    });
  });

  it('keeps resource rewards inside server-defined bounds', () => {
    const rule = RESOURCE_NODE_RULES['2,3'];
    expect(randomResourceAmount(rule, 0)).toBe(10);
    expect(randomResourceAmount(rule, 1)).toBe(21);
  });
});
