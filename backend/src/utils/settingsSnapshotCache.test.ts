import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsSnapshotCache } from './settingsSnapshotCache';

test('deduplicates concurrent settings reads and invalidates stale snapshots', async () => {
  let readCount = 0;
  const cache = createSettingsSnapshotCache<{ version: number }>({ ttlMs: 60_000 });
  const readSettings = async () => {
    readCount += 1;
    await Promise.resolve();
    return { version: readCount };
  };

  const [first, second] = await Promise.all([
    cache.get(readSettings),
    cache.get(readSettings),
  ]);

  assert.deepEqual(first, { version: 1 });
  assert.deepEqual(second, { version: 1 });
  assert.equal(readCount, 1);
  assert.strictEqual(await cache.get(readSettings), first);
  assert.equal(readCount, 1);

  cache.invalidate();

  assert.deepEqual(await cache.get(readSettings), { version: 2 });
  assert.equal(readCount, 2);
});
