import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCategoryFilterData } from './categoryFilters.mjs';

const categories = [
  { id: 'excavator', name: 'Excavator', count: 2 },
  { id: 'loader', name: 'Loader', count: 1 },
];

const listings = [
  { id: '1', title: 'JCB Excavator', category: { id: 'excavator', name: 'Excavator' }, brand: { name: 'JCB' }, condition: 'Good' },
  { id: '2', title: 'CAT Excavator', category: { id: 'excavator', name: 'Excavator' }, brand: { name: 'CAT' }, condition: 'Very Good' },
  { id: '3', title: 'JCB Loader', category: { id: 'loader', name: 'Loader' }, brand: { name: 'JCB' }, condition: 'Good' },
];

test('derives all category, brand, and condition facets from the page listings', () => {
  const result = buildCategoryFilterData({
    categories,
    listings,
    search: '',
    selectedCategory: 'ALL',
    selectedBrands: [],
    selectedConditions: [],
  });

  assert.deepEqual(result.categoryOptions, [
    { id: 'excavator', name: 'Excavator', count: 2 },
    { id: 'loader', name: 'Loader', count: 1 },
  ]);
  assert.deepEqual(result.brandOptions, [
    { name: 'JCB', count: 2 },
    { name: 'CAT', count: 1 },
  ]);
  assert.deepEqual(result.conditionOptions, [
    { name: 'Good', count: 2 },
    { name: 'Very Good', count: 1 },
  ]);
});

test('recomputes available facet counts from the active page filters', () => {
  const result = buildCategoryFilterData({
    categories,
    listings,
    search: 'excavator',
    selectedCategory: 'ALL',
    selectedBrands: ['JCB'],
    selectedConditions: [],
  });

  assert.deepEqual(result.categoryOptions, [{ id: 'excavator', name: 'Excavator', count: 1 }]);
  assert.deepEqual(result.brandOptions, [{ name: 'JCB', count: 1 }]);
  assert.deepEqual(result.conditionOptions, [{ name: 'Good', count: 1 }]);
});
