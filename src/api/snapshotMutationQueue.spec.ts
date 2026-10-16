import { describe, expect, it, vi } from 'vitest';
import { runSnapshotMutation } from './snapshotMutationQueue';

describe('runSnapshotMutation', () => {
  it('runs requests and applies snapshots in enqueue order', async () => {
    const events: string[] = [];
    let releaseFirst!: (value: string) => void;
    const first = runSnapshotMutation({
      operation: () => new Promise<string>((resolve) => { releaseFirst = resolve; }),
      apply: (value) => events.push(`apply:${value}`),
    });
    const second = runSnapshotMutation({
      operation: async () => { events.push('request:second'); return 'second'; },
      apply: (value) => events.push(`apply:${value}`),
    });

    await Promise.resolve();
    expect(events).toEqual([]);
    releaseFirst('first');
    await Promise.all([first, second]);

    expect(events).toEqual([
      'apply:first',
      'request:second',
      'apply:second',
    ]);
  });

  it('continues processing after a failed request', async () => {
    const apply = vi.fn();
    const failed = runSnapshotMutation({
      operation: async () => { throw new Error('network'); },
      apply,
    });
    const next = runSnapshotMutation({
      operation: async () => 'fresh',
      apply,
    });

    await expect(failed).rejects.toThrow('network');
    await expect(next).resolves.toBe('fresh');
    expect(apply).toHaveBeenCalledOnce();
    expect(apply).toHaveBeenCalledWith('fresh');
  });
});
