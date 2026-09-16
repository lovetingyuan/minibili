export const FAVORITE_FOLDER_NAME_MAX_LENGTH = 20;

// 控制字符、零宽字符与双向控制符等不可见字符；保留 U+200D（ZWJ）以支持组合 emoji。
const INVISIBLE_CHARACTERS =
  /[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200E\u200F\u2028-\u202E\u2060-\u2064\uFEFF]/u;

export function normalizeFavoriteFolderName(raw: string) {
  return raw.trim();
}

export function countFavoriteFolderNameLength(name: string) {
  return [...name].length;
}

export function getFavoriteFolderNameError(raw: string) {
  const name = normalizeFavoriteFolderName(raw);
  if (!name) {
    return "收藏夹名称不能为空";
  }
  if (INVISIBLE_CHARACTERS.test(raw)) {
    return "收藏夹名称包含不支持的字符";
  }
  if (countFavoriteFolderNameLength(name) > FAVORITE_FOLDER_NAME_MAX_LENGTH) {
    return `收藏夹名称不能超过 ${FAVORITE_FOLDER_NAME_MAX_LENGTH} 个字`;
  }
  return null;
}
