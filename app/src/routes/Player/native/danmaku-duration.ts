/** B站 DanmakuX 的 getBaseDmDuration：时长随屏宽和文本宽度变化。 */
const DURATION_RANGES = [
  { boundary: 558, max: 13, min: 7 },
  { boundary: 888, max: 14, min: 8 },
  { boundary: 1082, max: 14, min: 9 },
  { boundary: 1246, max: 15, min: 10 },
  { boundary: 1452, max: 16, min: 11 },
  { boundary: 1744, max: 18, min: 13 },
  { boundary: 2314, max: 20, min: 14 },
  { boundary: 2560, max: 22, min: 16 },
];

export const DANMAKU_FIXED_DURATION_MS = 4500;

export function resolveDanmakuDuration(containerWidth: number, textWidth: number) {
  if (containerWidth < DURATION_RANGES[0].boundary || textWidth <= 0) {
    return DANMAKU_FIXED_DURATION_MS;
  }
  const last = DURATION_RANGES[DURATION_RANGES.length - 1];
  let min = last.min;
  let max = last.max;
  if (containerWidth > last.boundary) {
    const extra = Math.floor((containerWidth - last.boundary) / 500);
    min += extra;
    max += extra;
  } else {
    for (let index = 1; index < DURATION_RANGES.length; index += 1) {
      if (containerWidth <= DURATION_RANGES[index].boundary) {
        ({ min, max } = DURATION_RANGES[index - 1]);
        break;
      }
    }
  }
  const midpoint = Math.log((max - min) / 0.1 - 1) / 0.2 + 0.2;
  return (
    1000 * (min + (max - min) / (1 + Math.exp(-0.2 * (textWidth / containerWidth - midpoint))))
  );
}
