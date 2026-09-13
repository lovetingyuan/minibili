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
};
