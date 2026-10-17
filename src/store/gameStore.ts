import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameSnapshot } from '../api/game';

// ─── Типы ─────────────────────────────────────────────────────────────────────

export type ResourceKey = 'wood' | 'stone' | 'metal' | 'energy';

export interface Resources {
  wood: number;
  stone: number;
  metal: number;
  energy: number;
}

export interface PlacedBuilding {
  id: string;
  type: string;
  tileC: number;
  tileR: number;
  startedAt: number;
  durationSec: number;
  endsAt: number | null;
}

export interface Pet {
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
}

export interface Toast {
  id: string;
  text: string;
  icon: string;
  color: string;
}

export interface FloatNum {
  id: string;
  svgX: number;
  svgY: number;
  text: string;
  color: string;
}

// ─── Вспомогательное ──────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

// XP нужно набрать на текущем уровне, чтобы перейти на следующий
const MAX_PLAYER_LEVEL = 30;
const LEVEL_XP = [0, 200, 300, 500, 800, 1200, 1800, 2600];
export function calcXpNext(lvl: number): number {
  const boundedLevel = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(lvl)));
  return LEVEL_XP[boundedLevel] ?? Math.floor(800 * Math.pow(1.35, boundedLevel - 1));
}

const COLLECT_CD = 30_000;

const RES_ICON: Record<ResourceKey, string> = { wood: '🌲', stone: '🪨', metal: '⚙️', energy: '⚡' };
const RES_CLR: Record<ResourceKey, string>  = { wood: '#6fc87a', stone: '#8b9bb4', metal: '#c0cfd9', energy: '#00ccff' };

// ─── Интерфейс ────────────────────────────────────────────────────────────────

interface GameState {
  backendConnected: boolean;
  playerName: string;
  level: number;
  xp: number;
  resources: Resources;
  buildings: PlacedBuilding[];
  collectCooldowns: Record<string, number>;

  pet: Pet;
  foundItems: string[];

  // счётчики для квестов
  woodCollects: number;
  stoneCollects: number;
  ruinsVisits: number;
  portalInteracts: number;
  totalBuilt: number;
  exploredZones: number;
  friendVisited: boolean;

  questProgress: Record<string, number>;
  claimedQuests: string[];

  lastDailyDate: string;
  levelUpPending: number | null;
  visitingFriend: string | null;
  onboardingDone: boolean;

  // transient
  toasts: Toast[];
  floatNums: FloatNum[];

  // actions
  setPlayerName: (n: string) => void;
  finishOnboarding: () => void;
  dismissLevelUp: () => void;

  canCollect: (tileKey: string) => boolean;
  collectTile: (tileKey: string, resource: ResourceKey, amount: number, svgX: number, svgY: number) => void;
  canAfford: (cost: Partial<Resources>) => boolean;
  spendResources: (cost: Partial<Resources>) => boolean;
  addResource: (r: ResourceKey, amount: number) => void;

  gainXP: (amount: number) => void;
  advanceQuest: (id: string, by?: number) => void;
  claimQuest: (id: string, xp: number, resources?: Partial<Resources>, items?: string[]) => void;

  startBuilding: (b: Omit<PlacedBuilding, 'id'>) => void;
  finishBuilding: (id: string) => void;

  feedPet: () => void;
  playWithPet: () => void;
  restPet: () => void;
  updatePetStats: () => void;

  onRuinsVisit: () => void;
  onPortalInteract: () => void;
  visitFriend: (id: string) => void;
  leaveVisit: () => void;

  claimDailyReward: () => void;
  discoverItem: (itemId: string) => void;

  addToast: (text: string, icon: string, color?: string) => void;
  removeToast: (id: string) => void;
  removeFloat: (id: string) => void;
  syncServerState: (snapshot: GameSnapshot) => void;
}

// ─── Начальное состояние питомца ──────────────────────────────────────────────

const DEFAULT_PET: Pet = {
  name: 'Нокс',
  species: 'Лисица-призрак',
  level: 1,
  xp: 0,
  xpNext: 200,
  hunger: 80,
  mood: 75,
  health: 90,
  lastUpdated: Date.now(),
  discovered: false,
};

// ─── Создание стора ───────────────────────────────────────────────────────────

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      backendConnected: false,
      playerName: 'Арис',
      level: 1,
      xp: 0,
      resources: { wood: 40, stone: 0, metal: 0, energy: 50 },
      buildings: [],
      collectCooldowns: {},

      pet: DEFAULT_PET,
      foundItems: ['i8'],

      woodCollects: 0,
      stoneCollects: 0,
      ruinsVisits: 0,
      portalInteracts: 0,
      totalBuilt: 0,
      exploredZones: 0,
      friendVisited: false,

      questProgress: {},
      claimedQuests: [],

      lastDailyDate: '',
      levelUpPending: null,
      visitingFriend: null,
      onboardingDone: false,

      toasts: [],
      floatNums: [],

      // ─── Базовые ────────────────────────────────────────────────────────────

      setPlayerName: (n) => set({ playerName: n }),
      finishOnboarding: () => set({ onboardingDone: true }),
      dismissLevelUp: () => set({ levelUpPending: null }),

      // ─── Ресурсы ────────────────────────────────────────────────────────────

      canCollect: (key) => Date.now() > (get().collectCooldowns[key] ?? 0),

      collectTile: (tileKey, resource, amount, svgX, svgY) => {
        if (!get().canCollect(tileKey)) {
          const wait = Math.ceil(((get().collectCooldowns[tileKey] ?? 0) - Date.now()) / 1000);
          get().addToast(`Ещё ${wait}с до перезарядки`, '⏳', '#6b7a99');
          return;
        }
        const fid = uid();
        set((s) => ({
          resources: { ...s.resources, [resource]: s.resources[resource] + amount },
          collectCooldowns: { ...s.collectCooldowns, [tileKey]: Date.now() + COLLECT_CD },
          floatNums: [...s.floatNums, { id: fid, svgX, svgY, text: `+${amount} ${RES_ICON[resource]}`, color: RES_CLR[resource] }],
          woodCollects:  s.woodCollects  + (resource === 'wood'  ? 1 : 0),
          stoneCollects: s.stoneCollects + (resource === 'stone' ? 1 : 0),
        }));
        setTimeout(() => set((s) => ({ floatNums: s.floatNums.filter((f) => f.id !== fid) })), 1800);

        get().gainXP(20);

        // Advance collect quests
        get().advanceQuest('q_collect', 1);
        if (resource === 'stone') get().advanceQuest('q_stone', 1);

        // Item discoveries
        const { foundItems, woodCollects } = get();
        if (resource === 'wood' && !foundItems.includes('i11')) get().discoverItem('i11');
        if (resource === 'wood' && woodCollects >= 4 && !foundItems.includes('i2')) get().discoverItem('i2');
        if (resource === 'stone' && !foundItems.includes('i1')) get().discoverItem('i1');
      },

      canAfford: (cost) => {
        const r = get().resources;
        return Object.entries(cost).every(([k, v]) => r[k as ResourceKey] >= (v ?? 0));
      },

      spendResources: (cost) => {
        if (!get().canAfford(cost)) return false;
        set((s) => ({
          resources: {
            wood:   s.resources.wood   - (cost.wood   ?? 0),
            stone:  s.resources.stone  - (cost.stone  ?? 0),
            metal:  s.resources.metal  - (cost.metal  ?? 0),
            energy: s.resources.energy - (cost.energy ?? 0),
          },
        }));
        return true;
      },

      addResource: (r, amount) =>
        set((s) => ({ resources: { ...s.resources, [r]: s.resources[r] + amount } })),

      // ─── Прогресс ───────────────────────────────────────────────────────────

      gainXP: (amount) => {
        set((s) => {
          let { xp, level } = s;
          if (level >= MAX_PLAYER_LEVEL) return { level: MAX_PLAYER_LEVEL, xp: 0 };
          xp = Math.max(0, xp + amount);
          let levelUpPending: number | null = null;
          while (level < MAX_PLAYER_LEVEL && xp >= calcXpNext(level)) {
            xp -= calcXpNext(level);
            level += 1;
            levelUpPending = level;
          }
          if (level >= MAX_PLAYER_LEVEL) xp = 0;
          const petUpdate = level >= 5 && !s.pet.discovered
            ? { pet: { ...s.pet, discovered: true } }
            : {};
          return { xp, level, levelUpPending: levelUpPending ?? s.levelUpPending, ...petUpdate };
        });
      },

      advanceQuest: (id, by = 1) => {
        if (by <= 0) return;
        set((s) => ({
          questProgress: { ...s.questProgress, [id]: (s.questProgress[id] ?? 0) + by },
        }));
      },

      claimQuest: (id, xp, resources, items) => {
        const { claimedQuests } = get();
        if (claimedQuests.includes(id)) return;
        set((s) => ({ claimedQuests: [...s.claimedQuests, id] }));
        get().gainXP(xp);
        if (resources) {
          Object.entries(resources).forEach(([k, v]) => {
            if (v) get().addResource(k as ResourceKey, v);
          });
        }
        if (items) {
          items.forEach((it) => get().discoverItem(it));
        }
        get().addToast(`+${xp} XP получено!`, '⭐', '#f5a857');
      },

      // ─── Постройки ──────────────────────────────────────────────────────────

      startBuilding: (b) => {
        const id = uid();
        set((s) => ({ buildings: [...s.buildings, { ...b, id }] }));
      },

      finishBuilding: (id) => {
        // The timer watcher can observe the same completed building more than once.
        // Only the first transition from "building" to "finished" may grant rewards.
        const building = get().buildings.find((item) => item.id === id);
        if (!building || building.endsAt === null) return;

        set((s) => ({
          buildings: s.buildings.map((b) => b.id === id ? { ...b, endsAt: null } : b),
          totalBuilt: s.totalBuilt + 1,
        }));
        get().gainXP(40);
        get().addToast('Постройка завершена! 🎊', '✅', '#00e5d0');
        get().advanceQuest('q_build', 1);
        get().advanceQuest('q_builder', 1);

        const { foundItems, totalBuilt } = get();
        if (totalBuilt >= 2 && !foundItems.includes('i9')) get().discoverItem('i9');
      },

      // ─── Питомец ────────────────────────────────────────────────────────────

      updatePetStats: () => {
        set((s) => {
          if (!s.pet.discovered) return {};
          const now = Date.now();
          const elapsedMs = Math.max(0, now - s.pet.lastUpdated);
          const minutes = Math.min(120, Math.floor(elapsedMs / 60000));
          if (minutes < 1) return {};
          let xp = s.pet.xp + minutes;
          let level = s.pet.level;
          while (level < 10 && xp >= Math.floor(200 * Math.pow(1.5, level - 1))) {
            xp -= Math.floor(200 * Math.pow(1.5, level - 1));
            level += 1;
          }
          if (level >= 10) xp = 0;
          const lastUpdated = elapsedMs > 120 * 60000 ? now : s.pet.lastUpdated + minutes * 60000;
          return { pet: { ...s.pet, xp, level, lastUpdated } };
        });
      },

      feedPet: () => {
        set((s) => {
          const p = s.pet;
          const hunger = Math.min(100, p.hunger + 35);
          const mood = hunger > 75 ? Math.min(100, p.mood + 5) : p.mood;
          return { pet: { ...p, hunger, mood, lastUpdated: Date.now() } };
        });
        get().gainXP(8);
        get().advanceQuest('q_pet', 1);
        get().addToast('Нокс накормлен!', '🍖', '#f5a857');
        const { foundItems } = get();
        if (!foundItems.includes('i12')) get().discoverItem('i12');
      },

      playWithPet: () => {
        set((s) => {
          const p = s.pet;
          const mood = Math.min(100, p.mood + 30);
          const hunger = Math.max(0, p.hunger - 8);
          let xp = p.xp + 25;
          let level = p.level;
          let xpNext = p.xpNext;
          if (xp >= xpNext && level < 10) {
            xp -= xpNext;
            level += 1;
            xpNext = Math.floor(200 * Math.pow(1.5, level - 1));
          }
          return { pet: { ...p, mood, hunger, xp, level, xpNext, lastUpdated: Date.now() } };
        });
        get().gainXP(12);
        get().addToast('Нокс доволен! ✨', '🎮', '#00e5d0');
      },

      restPet: () => {
        set((s) => ({
          pet: { ...s.pet, health: Math.min(100, s.pet.health + 20), lastUpdated: Date.now() },
        }));
        get().addToast('Нокс отдыхает...', '💤', '#a060ff');
      },

      // ─── Взаимодействие с картой ─────────────────────────────────────────────

      onRuinsVisit: () => {
        set((s) => ({ ruinsVisits: s.ruinsVisits + 1 }));
        get().gainXP(25);
        get().advanceQuest('q_ruins', 1);
        const { foundItems, ruinsVisits } = get();
        if (ruinsVisits >= 2 && !foundItems.includes('i4')) get().discoverItem('i4');
      },

      onPortalInteract: () => {
        set((s) => ({ portalInteracts: s.portalInteracts + 1 }));
        get().gainXP(30);
        get().advanceQuest('q_portal', 1);
        const { foundItems, portalInteracts } = get();
        if (portalInteracts >= 3 && !foundItems.includes('i7')) get().discoverItem('i7');
      },

      visitFriend: (id) => {
        set({ visitingFriend: id, friendVisited: true });
        get().gainXP(25);
        get().advanceQuest('q_visit', 1);
        const { foundItems } = get();
        if (!foundItems.includes('i9')) get().discoverItem('i9');
      },

      leaveVisit: () => set({ visitingFriend: null }),

      // ─── Ежедневная награда ─────────────────────────────────────────────────

      claimDailyReward: () => {
        const today = new Date().toISOString().split('T')[0];
        if (get().lastDailyDate === today) {
          get().addToast('Награда уже получена сегодня!', '📅', '#6b7a99');
          return;
        }
        const { level } = get();
        const wood   = 30 + level * 10;
        const stone  = level >= 2 ? 15 + level * 5 : 0;
        const energy = 10 + level * 3;
        set((s) => ({
          lastDailyDate: today,
          resources: {
            wood:   s.resources.wood   + wood,
            stone:  s.resources.stone  + stone,
            metal:  s.resources.metal,
            energy: s.resources.energy + energy,
          },
        }));
        get().gainXP(80);
        get().addToast(`+${wood}🌲 +${energy}⚡ Ежедневная награда!`, '🎁', '#f5a857');
      },

      // ─── Коллекция ──────────────────────────────────────────────────────────

      discoverItem: (itemId) => {
        set((s) => {
          if (s.foundItems.includes(itemId)) return {};
          return { foundItems: [...s.foundItems, itemId] };
        });
        const names: Record<string, string> = {
          i1: 'Древний камень', i2: 'Светящийся лист', i3: 'Кристалл Зеро',
          i4: 'Ржавый ключ', i6: 'Лунная бабочка', i7: 'Флакон портала',
          i8: 'Морская раковина', i9: 'Фрагмент карты', i11: 'Живое дерево',
          i12: 'Отпечаток',
        };
        const name = names[itemId];
        if (name) get().addToast(`Найдено: ${name}!`, '✨', '#a060ff');
      },

      // ─── UI ─────────────────────────────────────────────────────────────────

      addToast: (text, icon, color = '#00e5d0') => {
        const id = uid();
        set((s) => ({ toasts: [{ id, text, icon, color }, ...s.toasts].slice(0, 4) }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
      },

      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      removeFloat: (id) => set((s) => ({ floatNums: s.floatNums.filter((f) => f.id !== id) })),
      syncServerState: ({ world }) =>
        set((state) => ({
          backendConnected: true,
          level: world.level,
          xp: world.xp,
          resources: world.resources,
          buildings: world.buildings,
          collectCooldowns: world.collectCooldowns,
          lastDailyDate: world.lastDailyDate,
          woodCollects: world.woodCollects,
          stoneCollects: world.stoneCollects,
          ruinsVisits: world.ruinsVisits,
          portalInteracts: world.portalInteracts,
          totalBuilt: world.totalBuilt,
          friendVisited: world.friendVisited,
          questProgress: world.questProgress,
          claimedQuests: world.claimedQuests,
          foundItems: world.foundItems,
          pet: world.pet,
          levelUpPending:
            world.level > state.level ? world.level : state.levelUpPending,
        })),
    }),
    {
      name: 'afterzero-v3',
      partialize: (s) => ({
        playerName:      s.playerName,
        level:           s.level,
        xp:              s.xp,
        resources:       s.resources,
        buildings:       s.buildings,
        collectCooldowns:s.collectCooldowns,
        pet:             s.pet,
        foundItems:      s.foundItems,
        woodCollects:    s.woodCollects,
        stoneCollects:   s.stoneCollects,
        ruinsVisits:     s.ruinsVisits,
        portalInteracts: s.portalInteracts,
        totalBuilt:      s.totalBuilt,
        exploredZones:   s.exploredZones,
        friendVisited:   s.friendVisited,
        questProgress:   s.questProgress,
        claimedQuests:   s.claimedQuests,
        lastDailyDate:   s.lastDailyDate,
        onboardingDone:  s.onboardingDone,
      }),
    },
  ),
);
