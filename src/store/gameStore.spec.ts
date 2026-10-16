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


describe('gameStore building completion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.setState({
      buildings: [{
        id: 'building-1',
        type: 'house',
        tileC: 1,
        tileR: 1,
        startedAt: 0,
        durationSec: 1,
        endsAt: 1,
      }],
      totalBuilt: 0,
      foundItems: ['i8'],
      questProgress: {},
      xp: 0,
      level: 1,
      levelUpPending: null,
      toasts: [],
      floatNums: [],
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('grants building completion rewards only once', () => {
    const { finishBuilding } = useGameStore.getState();

    finishBuilding('building-1');
    finishBuilding('building-1');

    const state = useGameStore.getState();
    expect(state.buildings[0]?.endsAt).toBeNull();
    expect(state.totalBuilt).toBe(1);
    expect(state.xp).toBe(40);
    expect(state.questProgress.q_build).toBe(1);
    expect(state.questProgress.q_builder).toBe(1);
  });

  it('does not grant rewards for an unknown or already-finished building', () => {
    useGameStore.setState({
      buildings: [{
        id: 'finished',
        type: 'house',
        tileC: 1,
        tileR: 1,
        startedAt: 0,
        durationSec: 1,
        endsAt: null,
      }],
    });

    useGameStore.getState().finishBuilding('missing');
    useGameStore.getState().finishBuilding('finished');

    const state = useGameStore.getState();
    expect(state.totalBuilt).toBe(0);
    expect(state.xp).toBe(0);
    expect(state.questProgress.q_build).toBeUndefined();
  });
});
