export type RequestOptions = {
  withCookie?: boolean;
  /** 后台请求固定使用本轮凭证，避免请求之间混入另一账号。 */
  cookie?: string;
  signal?: AbortSignal;
  /** 后台失效交给任务处理，不发布前台登录事件或弹窗。 */
  silentAuthErrors?: boolean;
};
