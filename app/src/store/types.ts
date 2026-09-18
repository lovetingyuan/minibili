export interface FollowingDynamicsUpdateState {
  baseline: string;
  count: number;
}

/**
 * 「关注」列表 UP 未读小红点的状态：
 * baseline 是 feed/nav 的 update_baseline（已消费到的最新动态 id），
 * unread 是 UP mid -> 该 UP 最新未读动态 id_str。
 */
export interface FollowingDynamicsUnreadState {
  baseline: string;
  unread: Record<string, string>;
}
