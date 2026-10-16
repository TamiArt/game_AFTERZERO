import { useEffect, useRef, useState } from 'react';
import {
  authenticateTelegram,
  type BackendSession,
  isBackendConfigured,
} from '../api/auth';
import { getGameState } from '../api/game';
import { refreshAuthoritativeSession } from '../api/sessionLifecycle';
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

const SESSION_REFRESH_INTERVAL_MS = 8 * 60 * 1000;
const ACCESS_TOKEN_KEY = 'afterzero.accessToken';

export function useBackendSession(
  initData: string,
  telegramReady: boolean,
): BackendSessionState {
  const [state, setState] = useState<BackendSessionState>({
    error: null,
    session: null,
    status: isBackendConfigured() ? 'idle' : 'disabled',
  });
  const lastRefreshAt = useRef(0);
  const refreshInFlight = useRef(false);

  useEffect(() => {
    const expireSession = () => {
      setState({
        error: 'Игровая сессия истекла. Откройте приложение заново через Telegram.',
        session: null,
        status: 'error',
      });
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY && event.newValue === null) {
        expireSession();
      }
    };

    window.addEventListener('afterzero:session-expired', expireSession);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('afterzero:session-expired', expireSession);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!isBackendConfigured() || !telegramReady || !initData) return;

    const controller = new AbortController();
    setState({ error: null, session: null, status: 'loading' });

    void authenticateTelegram(initData, controller.signal)
      .then(async (session) => {
        const snapshot = await getGameState();
        if (controller.signal.aborted) return;
        lastRefreshAt.current = Date.now();
        useGameStore.getState().syncServerState(snapshot);
        setState({ error: null, session, status: 'authenticated' });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
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

  useEffect(() => {
    if (state.status !== 'authenticated' || !initData) return;

    let disposed = false;
    let refreshController: AbortController | null = null;

    const refresh = (force = false) => {
      if (
        document.visibilityState !== 'visible' ||
        refreshInFlight.current ||
        (!force && Date.now() - lastRefreshAt.current < SESSION_REFRESH_INTERVAL_MS)
      ) {
        return;
      }

      refreshInFlight.current = true;
      lastRefreshAt.current = Date.now();
      refreshController = new AbortController();
      const signal = refreshController.signal;

      void refreshAuthoritativeSession({
        authenticate: (refreshSignal) =>
          authenticateTelegram(initData, refreshSignal),
        getSnapshot: getGameState,
        signal,
        isCurrent: () => !disposed,
        applySnapshot: (snapshot) =>
          useGameStore.getState().syncServerState(snapshot),
        onSession: (session) =>
          setState({ error: null, session, status: 'authenticated' }),
      }).catch((error: unknown) => {
          if (
            disposed ||
            signal.aborted ||
            (error instanceof DOMException && error.name === 'AbortError')
          ) {
            return;
          }

          lastRefreshAt.current =
            Date.now() - SESSION_REFRESH_INTERVAL_MS + 60_000;
          if (
            error instanceof Error &&
            error.message === 'Telegram authentication was rejected'
          ) {
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
            setState({
              error: error.message,
              session: null,
              status: 'error',
            });
          }
        })
        .finally(() => {
          refreshInFlight.current = false;
          refreshController = null;
        });
    };

    const handleOnline = () => refresh(true);
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', handleOnline);
    return () => {
      disposed = true;
      refreshController?.abort();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', handleOnline);
    };
  }, [initData, state.status]);

  return state;
}
