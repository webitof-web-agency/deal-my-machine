import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_CHART_COLORS, getCategoryChartColor } from './dashboardChartConfig.mjs';

test('category chart colors cycle without changing the configured palette', () => {
  assert.equal(getCategoryChartColor(0), CATEGORY_CHART_COLORS[0]);
  assert.equal(getCategoryChartColor(CATEGORY_CHART_COLORS.length), CATEGORY_CHART_COLORS[0]);
  assert.equal(getCategoryChartColor(-1), CATEGORY_CHART_COLORS[CATEGORY_CHART_COLORS.length - 1]);
});
