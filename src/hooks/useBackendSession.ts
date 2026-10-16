import { useEffect, useState } from 'react';
import {
  authenticateTelegram,
  type BackendSession,
  isBackendConfigured,
} from '../api/auth';
import { getGameState } from '../api/game';
import { useGameStore } from '../store/gameStore';

type SessionStatus =
  | 'disabled'
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'error';

interface BackendSessionState {
  error: string | null;
  session: BackendSession | null;
  status: SessionStatus;
}

export function useBackendSession(
  initData: string,
  telegramReady: boolean,
): BackendSessionState {
  const [state, setState] = useState<BackendSessionState>({
    error: null,
    session: null,
    status: isBackendConfigured() ? 'idle' : 'disabled',
  });

  useEffect(() => {
    if (!isBackendConfigured() || !telegramReady || !initData) return;

    const controller = new AbortController();
    setState({ error: null, session: null, status: 'loading' });

    void authenticateTelegram(initData, controller.signal)
      .then(async (session) => {
        const snapshot = await getGameState();
        if (controller.signal.aborted) return;
        useGameStore.getState().syncServerState(snapshot);
        setState({ error: null, session, status: 'authenticated' });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          error:
            error instanceof Error
              ? error.message
              : 'Authentication failed',
          session: null,
          status: 'error',
        });
      });

    return () => controller.abort();
  }, [initData, telegramReady]);

  return state;
}
