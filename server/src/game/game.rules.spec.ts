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
