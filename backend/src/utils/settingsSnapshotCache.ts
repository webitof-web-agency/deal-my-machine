export type SettingsSnapshotCacheOptions = {
  ttlMs: number;
};

export const createSettingsSnapshotCache = <T>({ ttlMs }: SettingsSnapshotCacheOptions) => {
  let snapshot: T | undefined;
  let snapshotExpiresAt = 0;
  let hasSnapshot = false;
  let pendingRead: Promise<T> | null = null;

  const get = async (read: () => Promise<T>) => {
    if (hasSnapshot && Date.now() < snapshotExpiresAt) {
      return snapshot as T;
    }

    if (pendingRead) {
      return pendingRead;
    }

    pendingRead = read()
      .then((nextSnapshot) => {
        snapshot = nextSnapshot;
        snapshotExpiresAt = Date.now() + ttlMs;
        hasSnapshot = true;
        return nextSnapshot;
      })
      .finally(() => {
        pendingRead = null;
      });

    return pendingRead;
  };

  const invalidate = () => {
    snapshot = undefined;
    snapshotExpiresAt = 0;
    hasSnapshot = false;
  };

  return { get, invalidate };
};
