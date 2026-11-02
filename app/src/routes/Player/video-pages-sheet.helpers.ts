export function formatVideoPageTitle(title: string, page: number) {
  const normalized = title
    .replace(new RegExp(`^\\s*(?:P\\s*)?0*${page}\\s*[.．、:：-]\\s*`, "i"), "")
    .trim();
  return normalized || title.trim() || `第 ${page} P`;
}
