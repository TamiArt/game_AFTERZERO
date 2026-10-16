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
