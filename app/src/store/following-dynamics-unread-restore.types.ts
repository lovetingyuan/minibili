export type FollowingDynamicsUnreadRestore = {
  accountMid: string;
  generation: number;
  upMid: string;
  name: string;
  /** 从 UP 主页返回前不计时。 */
  expiresAt: number | null;
};
