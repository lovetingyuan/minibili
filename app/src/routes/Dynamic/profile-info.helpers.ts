/**
 * 折叠状态下 UP 主资料文案最多展示的行数：默认只占一行，
 * 只有实际行数超过它时才需要"详情/收起"按钮。
 */
export const PROFILE_INFO_COLLAPSED_LINES = 1;

export type ProfileInfoLines = {
  official: number;
  sign: number;
};

export type ProfileInfoLinesField = keyof ProfileInfoLines;

/** 任一字段超过折叠行数时，才在最后一个非空字段行尾放"详情"按钮 */
export function hasProfileInfoOverflow(lines: ProfileInfoLines): boolean {
  return lines.official > PROFILE_INFO_COLLAPSED_LINES || lines.sign > PROFILE_INFO_COLLAPSED_LINES;
}

/**
 * 写入某个字段的测量行数。
 * `onTextLayout` 会在重排时反复触发，行数没变时返回原引用让 React 直接跳过渲染。
 */
export function withProfileInfoLines(
  lines: ProfileInfoLines,
  field: ProfileInfoLinesField,
  value: number,
): ProfileInfoLines {
  if (lines[field] === value) {
    return lines;
  }
  return { ...lines, [field]: value };
}
