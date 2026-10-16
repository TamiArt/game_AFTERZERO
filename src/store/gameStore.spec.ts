import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from './gameStore';

describe('gameStore resource collection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.setState({
      resources: { wood: 40, stone: 0, metal: 0, energy: 50 },
      collectCooldowns: {},
      floatNums: [],
      woodCollects: 0,
      stoneCollects: 0,
      questProgress: {},
      foundItems: ['i8'],
      xp: 0,
      level: 1,
      levelUpPending: null,
      toasts: [],
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('advances the collect quest once for one wood collection', () => {
    useGameStore.getState().collectTile('2,3', 'wood', 12, 100, 80);

    const state = useGameStore.getState();
    expect(state.questProgress.q_collect).toBe(1);
    expect(state.resources.wood).toBe(52);
    expect(state.woodCollects).toBe(1);
  });

  it('advances both collect and stone quests once for one stone collection', () => {
    useGameStore.getState().collectTile('4,2', 'stone', 7, 100, 80);

    const state = useGameStore.getState();
    expect(state.questProgress.q_collect).toBe(1);
    expect(state.questProgress.q_stone).toBe(1);
    expect(state.resources.stone).toBe(7);
  });
});
