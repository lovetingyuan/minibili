export class UserDataUnauthorizedError extends Error {
  constructor() {
    super("请重新验证 B站登录后同步设置");
  }
}
