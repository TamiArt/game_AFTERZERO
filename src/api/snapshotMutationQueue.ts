type SnapshotMutationQueueOptions<T> = {
  operation: () => Promise<T>;
  apply: (snapshot: T) => void;
};

let queue: Promise<void> = Promise.resolve();

/**
 * Keep server mutations and their snapshot application in request order.
 * A later response must never overwrite a newer client snapshot merely
 * because the network returned requests out of order.
 */
export function runSnapshotMutation<T>({
  operation,
  apply,
}: SnapshotMutationQueueOptions<T>): Promise<T> {
  const result = queue.then(async () => {
    const snapshot = await operation();
    apply(snapshot);
    return snapshot;
  });

  // A rejected request must not permanently block subsequent gameplay actions.
  queue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}
