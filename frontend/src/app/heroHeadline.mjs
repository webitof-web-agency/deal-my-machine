export const getHeroHeadlineLines = (value) =>
  String(value || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim());

export const getHeroHeadlineAccentLineIndex = (lines) => {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index].length > 0) return index;
  }

  return 0;
};
