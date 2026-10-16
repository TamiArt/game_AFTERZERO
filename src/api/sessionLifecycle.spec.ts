import { describe, expect, it, vi } from 'vitest';
import {
  notifySessionExpired,
  SESSION_EXPIRED_EVENT,
  refreshAuthoritativeSession,
} from './sessionLifecycle';

describe('notifySessionExpired', () => {
  it('removes the token before notifying the session controller', () => {
    const calls: string[] = [];
    notifySessionExpired({
      removeToken: () => calls.push('remove-token'),
      dispatch: (eventName) => calls.push(`dispatch:${eventName}`),
    });

    expect(calls).toEqual([
      'remove-token',
      `dispatch:${SESSION_EXPIRED_EVENT}`,
    ]);
  });

  it('does not dispatch a misleading expiry event if token cleanup fails', () => {
    const dispatch = vi.fn();
    expect(() =>
      notifySessionExpired({
        removeToken: () => {
          throw new Error('storage unavailable');
        },
        dispatch,
      }),
    ).toThrow('storage unavailable');
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('refreshAuthoritativeSession', () => {
  it('applies the authoritative snapshot before publishing the refreshed session', async () => {
    const calls: string[] = [];
    const controller = new AbortController();

    await refreshAuthoritativeSession({
      authenticate: async (signal) => {
        expect(signal).toBe(controller.signal);
        calls.push('authenticate');
        return { accessToken: 'fresh-token' };
      },
      getSnapshot: async () => {
        calls.push('get-snapshot');
        return { world: 'server-world' };
      },
      signal: controller.signal,
      isCurrent: () => true,
      applySnapshot: (snapshot) => calls.push(`apply:${snapshot.world}`),
      onSession: (session) => calls.push(`session:${session.accessToken}`),
    });

    expect(calls).toEqual([
      'authenticate',
      'get-snapshot',
      'apply:server-world',
      'session:fresh-token',
    ]);
  });

  it('does not apply a snapshot or publish a session after cancellation', async () => {
    const controller = new AbortController();
    const applySnapshot = vi.fn();
    const onSession = vi.fn();

    await refreshAuthoritativeSession({
      authenticate: async () => ({ accessToken: 'fresh-token' }),
      getSnapshot: async () => {
        controller.abort();
        return { world: 'stale-world' };
      },
      signal: controller.signal,
      isCurrent: () => true,
      applySnapshot,
      onSession,
    });

    expect(applySnapshot).not.toHaveBeenCalled();
    expect(onSession).not.toHaveBeenCalled();
  });

  it('does not publish data when the owning effect is no longer current', async () => {
    const applySnapshot = vi.fn();
    const onSession = vi.fn();

    await refreshAuthoritativeSession({
      authenticate: async () => ({ accessToken: 'fresh-token' }),
      getSnapshot: async () => ({ world: 'stale-world' }),
      signal: new AbortController().signal,
      isCurrent: () => false,
      applySnapshot,
      onSession,
    });

    expect(applySnapshot).not.toHaveBeenCalled();
    expect(onSession).not.toHaveBeenCalled();
  });
});
