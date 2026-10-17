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


describe('gameStore progression and offline production', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.setState({
      level: 1,
      xp: 0,
      levelUpPending: null,
      lastProductionAt: Date.now(),
      resources: { wood: 0, stone: 0, metal: 0, energy: 0 },
      buildings: [],
      toasts: [],
      floatNums: [],
      foundItems: ['i8'],
      questProgress: {},
      totalBuilt: 0,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('carries local XP across multiple levels and stops at level 30', () => {
    useGameStore.getState().gainXP(1_000);
    expect(useGameStore.getState()).toMatchObject({ level: 4, xp: 0 });

    useGameStore.getState().gainXP(100_000_000);
    expect(useGameStore.getState()).toMatchObject({ level: 30, xp: 0 });
  });

  it('accrues demo production on return and prevents repeated capped claims', () => {
    const now = Date.now();
    useGameStore.setState({
      lastProductionAt: now - 24 * 60 * 60 * 1000,
      resources: { wood: 0, stone: 0, metal: 0, energy: 0 },
      buildings: [
        { id: 'garden', type: 'garden', tileC: 1, tileR: 1, startedAt: 0, durationSec: 1, endsAt: null },
        { id: 'farm', type: 'farm', tileC: 2, tileR: 1, startedAt: 0, durationSec: 1, endsAt: null },
        { id: 'workshop', type: 'workshop', tileC: 3, tileR: 1, startedAt: 0, durationSec: 1, endsAt: null },
      ],
    });

    useGameStore.getState().claimOfflineProduction();
    expect(useGameStore.getState().resources).toEqual({ wood: 0, stone: 120, metal: 120, energy: 240 });
    expect(useGameStore.getState().lastProductionAt).toBe(now);

    useGameStore.getState().claimOfflineProduction();
    expect(useGameStore.getState().resources).toEqual({ wood: 0, stone: 120, metal: 120, energy: 240 });
  });
});
