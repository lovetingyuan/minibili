export type KeyboardFrame = { height: number; screenY: number };

/**
 * 键盘遮挡窗口底部的高度。
 *
 * 优先按键盘顶边（screenY）算：Android 上报的 height 不含导航栏区域，
 * 会比实际遮挡高度小一个底部安全区，直接用会有一截输入框被键盘盖住。
 * screenY 缺失时退回 height。
 */
export function getKeyboardOverlap(frame: KeyboardFrame, windowHeight: number) {
  const overlap = frame.screenY > 0 ? windowHeight - frame.screenY : frame.height;

  return Math.max(0, Math.round(overlap));
}
