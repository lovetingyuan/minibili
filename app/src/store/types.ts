export interface FollowingDynamicsUpdateState {
  baseline: string;
  count: number;
  /** 最近一次查看动态列表的时间，旧轮询即使基线相同也不能恢复未读数。 */
  readAt?: number;
}
