export type DanmakuItem = {
  /**
   * 出现时间，单位毫秒
   */
  progressMs: number;
  content: string;
  /**
   * RGB 十进制色值
   */
  color: number;
  fontsize: number;
  /** 不填时按滚动弹幕渲染；4 为底部，5 为顶部。 */
  mode?: 4 | 5;
};
