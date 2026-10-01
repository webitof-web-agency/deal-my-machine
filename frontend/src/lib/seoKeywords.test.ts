import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLocationKeyword,
  buildMachineLocationDescription,
  buildMachineLocationTitle,
  getSeoKeywordCluster,
} from './seoKeywords';

test('keeps platform SEO terms centralized without removing machinery brand terms', () => {
  const categories = getSeoKeywordCluster('categories');

  assert.ok(categories.includes('JCB 3DX Backhoe Loader for Sale'));
  assert.ok(categories.includes('Used Excavator for Sale'));
});

test('builds city and state search intent without adding hidden keyword stuffing', () => {
  assert.equal(
    buildLocationKeyword('Heavy Machinery Dealer', 'Raipur', 'Chhattisgarh'),
    'Heavy Machinery Dealer in Raipur, Chhattisgarh',
  );
});

test('builds stable location page metadata', () => {
  assert.equal(
    buildMachineLocationTitle({ category: 'Excavator', city: 'Raipur', state: 'Chhattisgarh' }),
    'Excavator Machines for Sale in Raipur, Chhattisgarh',
  );
  assert.match(
    buildMachineLocationDescription({ city: 'Pune', state: 'Maharashtra' }),
    /new and used heavy machinery for sale in Pune, Maharashtra/i,
  );
});
