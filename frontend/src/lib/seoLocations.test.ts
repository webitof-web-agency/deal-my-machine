import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMachineLocationCategoryPath,
  buildMachineLocationPath,
  buildSeoLocationSlug,
  formatSeoLocation,
} from './seoLocations';

test('uses city and state in location slugs to avoid same-city collisions', () => {
  assert.equal(buildSeoLocationSlug({ city: 'Raipur', state: 'Chhattisgarh' }), 'raipur-chhattisgarh');
  assert.equal(buildMachineLocationPath({ city: 'Raipur', state: 'Chhattisgarh' }), '/machines/location/raipur-chhattisgarh');
});

test('builds a safe city and category path', () => {
  assert.equal(
    buildMachineLocationCategoryPath({ city: 'Pune', state: 'Maharashtra', category: 'Road Roller / Compactor' }),
    '/machines/location/pune-maharashtra/road-roller-compactor',
  );
});

test('formats location labels for visible metadata', () => {
  assert.equal(formatSeoLocation({ city: 'Nagpur', state: 'Maharashtra' }), 'Nagpur, Maharashtra');
  assert.equal(formatSeoLocation({ city: 'Nagpur' }), 'Nagpur');
});
