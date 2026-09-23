const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_COLOR = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i;

/**
 * 给 hex / rgb() 颜色加上透明度，用于 Android ripple 这类需要带 alpha 的色值。
 * 解析不了的写法（hsl、颜色名、百分比写法等）返回 undefined，由调用方决定兜底色。
 */
export function withAlpha(color: string | undefined, alpha: number) {
  if (!color) {
    return undefined;
  }

  const value = color.trim();

  if (HEX_COLOR.test(value)) {
    const hex = value.slice(1);
    const expanded = hex.length === 3 ? hex.replace(/./g, (char) => char + char) : hex;
    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const rgb = RGB_COLOR.exec(value);
  if (rgb) {
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
  }

  return undefined;
}
