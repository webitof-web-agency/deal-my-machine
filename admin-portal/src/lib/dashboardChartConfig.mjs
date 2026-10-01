export const CATEGORY_CHART_COLORS = ['#FFC107', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

export function getCategoryChartColor(index) {
  const colorIndex = ((index % CATEGORY_CHART_COLORS.length) + CATEGORY_CHART_COLORS.length) % CATEGORY_CHART_COLORS.length;
  return CATEGORY_CHART_COLORS[colorIndex];
}
