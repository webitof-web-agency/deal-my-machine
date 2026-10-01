import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDealerFilterData } from './dealerFilters.mjs';

const dealers = [
  {
    id: '1',
    businessName: 'Alpha Earthmovers',
    district: 'Pune',
    businessAddress: 'Chakan MIDC',
    partnerType: 'SHOWROOM',
    categories: ['Excavator'],
    serviceAreas: 'Sales, Rental',
  },
  {
    id: '2',
    businessName: 'Beta Machines',
    district: 'Mumbai',
    businessAddress: 'Andheri',
    partnerType: 'BROKER',
    categories: ['Loader'],
    serviceAreas: 'Sales',
  },
];

test('derives dealer filters and counts from the current dealer data', () => {
  const result = buildDealerFilterData({
    dealers,
    search: '',
    selectedLocation: '',
    selectedDealerTypes: [],
    selectedCategories: [],
    selectedServices: [],
  });

  assert.deepEqual(result.filteredDealers.map((dealer) => dealer.id), ['1', '2']);
  assert.equal('brandOptions' in result, false);
  assert.deepEqual(result.categoryOptions, [
    { name: 'Excavator', count: 1 },
    { name: 'Loader', count: 1 },
  ]);
  assert.deepEqual(result.serviceOptions, [
    { name: 'Sales', count: 2 },
    { name: 'Rental', count: 1 },
  ]);
});

test('filters dealers by location, dealer type, and dynamic category data', () => {
  const result = buildDealerFilterData({
    dealers,
    search: 'pune',
    selectedLocation: 'Pune',
    selectedDealerTypes: ['SHOWROOM'],
    selectedCategories: [],
    selectedServices: [],
  });

  assert.deepEqual(result.filteredDealers.map((dealer) => dealer.id), ['1']);
});
