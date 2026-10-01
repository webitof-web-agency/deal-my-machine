import test from 'node:test';
import assert from 'node:assert/strict';
import { formatApiHealthMessage, formatAnalyticsExportFilename } from './brandText.js';

test('formats the API health message from the configured app name', () => {
  assert.equal(formatApiHealthMessage('DealMyMachine'), 'DealMyMachine API is running');
});

test('formats analytics export filenames from a safe app slug', () => {
  assert.equal(
    formatAnalyticsExportFilename('Deal My Machine', '2026-09-30'),
    'deal-my-machine-analytics-listings-2026-09-30.csv',
  );
});
