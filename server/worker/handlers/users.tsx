import type { AppContext } from "../types";
import { verifyManagementAuth } from "../users/auth";
import { UsersErrorPage, UsersPage } from "../users/page";
import { getClientIp, isRateLimited, RATE_LIMIT_RETRY_AFTER } from "../utils/rate-limit";

const DIRECTORY_NAME = "global";
const MAX_QUERY_LENGTH = 64;

function setPrivatePageHeaders(c: AppContext) {
  c.header("Cache-Control", "no-store");
  c.header("Referrer-Policy", "no-referrer");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
}

export async function handleUsersPage(c: AppContext) {
  setPrivatePageHeaders(c);
  const auth = await verifyManagementAuth(
    c.req.header("Authorization"),
    c.env.MINIBILI_MANAGEMENT_PASSWD,
  );
  if (auth === "unconfigured") {
    console.error(
      JSON.stringify({
        message: "management password is not configured",
        path: "/users",
      }),
    );
    return c.html(
      <UsersErrorPage title="管理页面暂不可用" message="服务端尚未配置管理密码。" />,
      503,
    );
  }
  if (auth === "unauthorized") {
    // 只有认证失败才计数：正常浏览与搜索不会消耗配额。
    if (await isRateLimited(c.env.RATE_LIMIT_ADMIN, "admin", getClientIp(c))) {
      c.header("Retry-After", RATE_LIMIT_RETRY_AFTER);
      return c.html(
        <UsersErrorPage title="尝试过于频繁" message="认证失败次数过多，请稍后再试。" />,
        429,
      );
    }
    c.header("WWW-Authenticate", 'Basic realm="MiniBili Users", charset="UTF-8"');
    return c.html(<UsersErrorPage title="需要认证" message="请输入正确的管理账号和密码。" />, 401);
  }

  const query = (new URL(c.req.url).searchParams.get("q")?.trim() ?? "").slice(0, MAX_QUERY_LENGTH);
  try {
    const users = await c.env.USER_DIRECTORY.getByName(DIRECTORY_NAME).listUsers(query);
    return c.html(<UsersPage users={users} query={query} />, 200);
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "failed to list users",
        error: error instanceof Error ? error.message : String(error),
        path: "/users",
      }),
    );
    return c.html(
      <UsersErrorPage title="用户列表加载失败" message="用户目录暂时不可用，请稍后重试。" />,
      503,
    );
  }
}
