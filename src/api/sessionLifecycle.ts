export const SESSION_EXPIRED_EVENT = 'afterzero:session-expired';

export interface SessionExpiryEffects {
  removeToken: () => void;
  dispatch: (eventName: string) => void;
}

/** Keeps token cleanup and UI notification coupled for every API client. */
export function notifySessionExpired({
  removeToken,
  dispatch,
}: SessionExpiryEffects): void {
  removeToken();
  dispatch(SESSION_EXPIRED_EVENT);
}

export interface AuthoritativeRefreshOptions<TSession, TSnapshot> {
  authenticate: (signal: AbortSignal) => Promise<TSession>;
  getSnapshot: () => Promise<TSnapshot>;
  signal: AbortSignal;
  isCurrent: () => boolean;
  applySnapshot: (snapshot: TSnapshot) => void;
  onSession: (session: TSession) => void;
}

/** Applies refreshed session data only after the matching authoritative snapshot is available. */
export async function refreshAuthoritativeSession<TSession, TSnapshot>({
  authenticate,
  getSnapshot,
  signal,
  isCurrent,
  applySnapshot,
  onSession,
}: AuthoritativeRefreshOptions<TSession, TSnapshot>): Promise<void> {
  const session = await authenticate(signal);
  const snapshot = await getSnapshot();
  if (signal.aborted || !isCurrent()) return;
  applySnapshot(snapshot);
  onSession(session);
}
