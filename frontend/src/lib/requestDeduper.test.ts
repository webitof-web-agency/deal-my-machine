import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestDeduper } from './requestDeduper';

test('shares one in-flight request between concurrent callers', async () => {
  let requestCount = 0;
  const run = createRequestDeduper();
  const request = async () => {
    requestCount += 1;
    await Promise.resolve();
    return 'loaded';
  };

  const [first, second] = await Promise.all([run(request), run(request)]);

  assert.equal(first, 'loaded');
  assert.equal(second, 'loaded');
  assert.equal(requestCount, 1);
});
