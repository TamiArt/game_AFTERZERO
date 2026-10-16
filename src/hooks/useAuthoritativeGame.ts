import { useCallback, useRef } from 'react';
import {
  claimServerDaily,
  claimServerProduction,
  claimServerQuest,
  collectResource,
  completeServerBuilding,
  GameApiError,
  hasBackendSession,
  isGameBackendConfigured,
  exploreServerCollection,
  serverPetAction,
  serverWorldInteraction,
  startServerBuilding,
  type GameSnapshot,
} from '../api/game';
import { runSnapshotMutation } from '../api/snapshotMutationQueue';
import {
  useGameStore,
  type PlacedBuilding,
  type ResourceKey,
  type Resources,
} from '../store/gameStore';

function applySnapshot(snapshot: GameSnapshot): void {
  useGameStore.getState().syncServerState(snapshot);
}

function reportError(error: unknown): void {
  const localizedErrors: Record<string, string> = {
    'Resource node is recharging': 'Ресурс ещё восстанавливается.',
    'Not enough resources': 'Не хватает ресурсов.',
    'Not enough energy': 'Не хватает энергии.',
    'Tile is already occupied': 'Эта клетка уже занята.',
    'Building is not ready': 'Строительство ещё не завершено.',
    'Daily reward was already claimed': 'Ежедневная награда уже получена.',
    'Quest reward was already claimed': 'Награда за квест уже получена.',
    'Quest is not complete': 'Условия квеста ещё не выполнены.',
    'All available items were discovered': 'Все доступные предметы уже найдены.',
  };
  const message =
    error instanceof GameApiError && localizedErrors[error.message]
      ? localizedErrors[error.message]
      : 'Не удалось выполнить действие. Попробуйте ещё раз.';
  useGameStore.getState().addToast(message, '!', '#ff6b7a');
}

function requireSession(): boolean {
  if (hasBackendSession()) return true;
  useGameStore
    .getState()
    .addToast('Игровая сессия истекла. Перезапустите приложение.', '!', '#ff6b7a');
  return false;
}

export function useAuthoritativeGame() {
  const pendingBuildingIds = useRef(new Set<string>());
  const collect = useCallback(
    (
      tileKey: string,
      resource: ResourceKey,
      amount: number,
      svgX: number,
      svgY: number,
    ) => {
      if (!isGameBackendConfigured()) {
        useGameStore
          .getState()
          .collectTile(tileKey, resource, amount, svgX, svgY);
        return;
      }
      if (!requireSession()) return;
      void runSnapshotMutation({ operation: () => collectResource(tileKey), apply: applySnapshot }).catch(reportError);
    },
    [],
  );

  const build = useCallback(
    async (
      type: string,
      tileC: number,
      tileR: number,
      cost: Partial<Resources>,
      durationSec: number,
    ): Promise<boolean> => {
      const state = useGameStore.getState();
      if (!isGameBackendConfigured()) {
        if (!state.spendResources(cost)) {
          state.addToast('Не хватает ресурсов!', '!', '#ff6b7a');
          return false;
        }
        const now = Date.now();
        state.startBuilding({
          type,
          tileC,
          tileR,
          startedAt: now,
          durationSec,
          endsAt: now + durationSec * 1000,
        });
        state.gainXP(15);
        return true;
      }
      if (!requireSession()) return false;

      try {
        await runSnapshotMutation({ operation: () => startServerBuilding(type, tileC, tileR), apply: applySnapshot });
        return true;
      } catch (error) {
        reportError(error);
        return false;
      }
    },
    [],
  );

  const complete = useCallback(async (building: PlacedBuilding) => {
    if (!isGameBackendConfigured()) {
      useGameStore.getState().finishBuilding(building.id);
      return;
    }
    if (!requireSession() || pendingBuildingIds.current.has(building.id)) return;

    // The one-second watcher must not issue concurrent completion requests while
    // the server is processing the first request.
    pendingBuildingIds.current.add(building.id);
    try {
      await runSnapshotMutation({ operation: () => completeServerBuilding(building.id), apply: applySnapshot });
    } catch (error) {
      reportError(error);
    } finally {
      pendingBuildingIds.current.delete(building.id);
    }
  }, []);

  const claimDaily = useCallback(() => {
    if (!isGameBackendConfigured()) {
      useGameStore.getState().claimDailyReward();
      return;
    }
    if (!requireSession()) return;
    void runSnapshotMutation({ operation: claimServerDaily, apply: applySnapshot }).catch(reportError);
  }, []);

  const claimProduction = useCallback(() => {
    const state = useGameStore.getState();
    if (!isGameBackendConfigured()) {
      for (const building of state.buildings.filter((item) => item.endsAt === null)) {
        if (building.type === 'garden') state.addResource('energy', 2);
        if (building.type === 'farm') state.addResource('stone', 1);
        if (building.type === 'workshop') state.addResource('metal', 1);
      }
      return;
    }
    if (!requireSession()) return;
    void runSnapshotMutation({ operation: claimServerProduction, apply: applySnapshot }).catch(reportError);
  }, []);

  const claimQuest = useCallback(
    (
      id: string,
      xp: number,
      resources?: Partial<Resources>,
      items?: string[],
    ) => {
      if (!isGameBackendConfigured()) {
        useGameStore.getState().claimQuest(id, xp, resources, items);
        return;
      }
      if (!requireSession()) return;
      void runSnapshotMutation({ operation: () => claimServerQuest(id), apply: applySnapshot }).catch(reportError);
    },
    [],
  );

  const exploreCollection = useCallback(() => {
    const state = useGameStore.getState();
    if (!isGameBackendConfigured()) {
      if (!state.spendResources({ energy: 10 })) {
        state.addToast('Нужно 10 энергии для исследования', '!', '#ff6b7a');
        return;
      }
      const candidates = ['i1', 'i2', 'i3', 'i4', 'i6', 'i7', 'i9', 'i11', 'i12']
        .filter((item) => !state.foundItems.includes(item));
      if (candidates.length > 0) {
        state.discoverItem(
          candidates[Math.floor(Math.random() * candidates.length)],
        );
      }
      return;
    }
    if (!requireSession()) return;
    void runSnapshotMutation({ operation: exploreServerCollection, apply: applySnapshot }).catch(reportError);
  }, []);

  const petAction = useCallback((action: 'feed' | 'play' | 'rest') => {
    if (!isGameBackendConfigured()) {
      const state = useGameStore.getState();
      if (action === 'feed') state.feedPet();
      if (action === 'play') state.playWithPet();
      if (action === 'rest') state.restPet();
      return;
    }
    if (!requireSession()) return;
    void runSnapshotMutation({ operation: () => serverPetAction(action), apply: applySnapshot }).catch(reportError);
  }, []);

  const interact = useCallback((action: 'ruins' | 'portal') => {
    if (!isGameBackendConfigured()) {
      const state = useGameStore.getState();
      if (action === 'ruins') state.onRuinsVisit();
      if (action === 'portal') state.onPortalInteract();
      return;
    }
    if (!requireSession()) return;
    void runSnapshotMutation({ operation: () => serverWorldInteraction(action), apply: applySnapshot }).catch(reportError);
  }, []);

  return {
    build,
    claimDaily,
    claimProduction,
    claimQuest,
    collect,
    complete,
    exploreCollection,
    interact,
    petAction,
  };
}
