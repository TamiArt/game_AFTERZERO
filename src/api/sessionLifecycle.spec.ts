import { describe, expect, it, vi } from 'vitest';
import {
  notifySessionExpired,
  SESSION_EXPIRED_EVENT,
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
