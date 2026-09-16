const SHEET_MAX_HEIGHT_RATIO = 0.6;
const SHEET_HEADER_HEIGHT = 76;
const SHEET_ROW_HEIGHT = 60;

export function getVideoPagesSheetHeight(screenHeight: number, pageCount: number) {
  return Math.round(
    Math.min(
      Math.max(0, screenHeight) * SHEET_MAX_HEIGHT_RATIO,
      SHEET_HEADER_HEIGHT + Math.max(1, pageCount) * SHEET_ROW_HEIGHT,
    ),
  );
}

export function formatVideoPageTitle(title: string, page: number) {
  const normalized = title
    .replace(new RegExp(`^\\s*(?:P\\s*)?0*${page}\\s*[.．、:：-]\\s*`, "i"), "")
    .trim();
  return normalized || title.trim() || `第 ${page} P`;
}
