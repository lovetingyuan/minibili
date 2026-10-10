```txt
npm install
npm run db:migrate:local
npm run dev
```

开发服务器（`vite`）监听 `0.0.0.0:8787`，对应 app 开发构建里的 `127.0.0.1:8787`（由 `npm run dev` 通过 `adb reverse` 反代）。Worker 处理 `/share`、`/share.html`、`/users`、`/api/*` 与 `/health`，其余路径由静态资源与 SPA 回退处理。

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `Env` as generics when instantiation `Hono`:

```ts
// worker/index.ts
const app = new Hono<{ Bindings: Env }>();
```

## 视频分享页

`GET /share?bvid=<BV号>&p=<分片>` 是分享链接使用的页面，由 Worker 用 Hono JSX 直出（`worker/share/`）：上方是 B站 iframe 播放器，下方展示标题、简介、UP 主、投稿时间、播放/点赞/投币/收藏/转发/弹幕/评论数以及分P 列表。视频信息在服务端进程内取好后再渲染，因此 HTML 带真实的 `title`、`description` 与 OG 标签，样式也内联在页面里；客户端只有一段内联脚本负责复制链接与简介展开，分P 切换是真实链接。字段定义见 `shared/video-info.ts`。`/share.html` 会 307 跳转到 `/share` 并保留查询串。

- `bvid` 缺失或非法返回 `400`；B站返回视频不存在（`-404`）时返回 `404`；上游超时、风控或结构异常时返回 `502`；同一 IP 每分钟超过 60 次返回 `429`。失败都只输出精简错误页（站头站尾 + 错误卡片 + 重新加载链接），不嵌播放器，且响应不缓存。
- `p` 非正整数或超出分片数量时按第 1 个分片处理，`cid` 与时长也跟随实际生效的分片。
- 取数只读、匿名可用，不携带任何 Cookie；上游请求经 `bili-proxy` 中转（见下节），业务码为 `0` 的结果缓存 300 秒，页面响应头为 `Cache-Control: public, max-age=300`。UP 主粉丝数来自 `/x/relation/stat`，取不到时为 `null`。
- `canonical` 与 `og:url` 使用固定站点域名，不取请求 `Host`。

## 用户设置同步

用户资料和设置存放在 D1 数据库 `minibili`，Worker 通过 `DB` binding 和 Drizzle 操作数据库。`users` 以 B站 UID 为主键，记录昵称、首次登录时间、最近打开时间和 app 版本；`user_data` 每个用户一行，保存黑名单标签、视频分区排序和设置更新时间，两项复杂设置均使用 JSON 列。

`POST /api/user-data/sync` 接受 `{ settings?: { blackTags?: Record<string, string>, videoCatesList?: { rid: number }[] } }`，返回 `{ success: true, uid: string, settings: { blackTags: Record<string, string>, videoCatesList: { rid: number }[] } }`。

`{}` 或空 `settings` 读取完整设置。仅更新提交的字段，空对象/空数组用于清空；未知字段、错误类型和旧的 `get/set/delete` 协议均返回 `400`。分区只保存 `rid` 和顺序，客户端负责恢复名称、补齐新增分区和默认排序。同步不会刷新已有用户的昵称、最近打开时间或 app 版本，读取不会刷新设置更新时间。

请求使用 `X-Bilibili-Cookie` 携带 B站登录 Cookie，可通过 `X-MiniBili-App-Version` 上报 app 版本。服务端每次向 B站验证身份，只使用验证响应中的 UID，验证失败前不访问数据库。数据库不保存 Cookie。生产环境必须通过 HTTPS 访问，不允许重定向凭证。

请求体最多 128 KiB，`Content-Type` 必须是 `application/json`。状态码：格式错误 `400`，登录缺失/失效 `401`，请求过大 `413`，触发限流 `429`，B站暂不可验证或数据库失败 `503`。所有响应均禁止缓存。初始化用户、初始化设置、局部更新和读取结果通过同一 Drizzle batch 原子执行，允许同步先于启动登记到达。

限流分两道：请求体解析后先按来源 IP 计数（每分钟 60 次），身份校验通过后再按 UID 计数（每分钟 60 次）。启动登记和设置同步共用 `RATE_LIMIT_SYNC`，按 Cloudflare 节点本地计数；`limit()` 自身出错时放行并记日志。

游客、本地账号缓存和待同步修改分别隔离存储。有效登录时自动同步，失败保留修改；切换账号不会上传游客或其他账号的数据。不同设置字段的并发更新互不覆盖，同一设置采用最后成功写入的值。客户端继续使用 `$blackTags`、`$videoCatesList` 作为本地字段。

## 启动登记

`POST /api/users/open` 接受空 JSON 对象 `{}`，使用与设置同步相同的凭证和版本请求头，返回 `{ success: true, uid: string }`。

客户端冷启动恢复有效账号后、登录成功后各登记一次，按本次 app 运行周期内的 `mid + generation` 去重。后台回到前台、手动设置同步和成功后的网络重连均不会重复登记。临时失败可重试，账号变化会取消旧请求；登记失败不阻塞设置同步和页面使用。

服务端从 B站验证响应刷新昵称，并更新最近打开时间和 app 版本；首次登录时间不变。所有时间使用服务端 Unix 毫秒时间戳，离线首次登录以恢复网络后首次成功登记为准。条件 upsert 防止较早的并发请求覆盖较新的登记，用户登记和默认设置初始化在同一个 batch 中执行。

## 数据库迁移与部署

表结构定义在 `worker/db/schema.ts`，通过 Drizzle Kit 生成 SQL，统一由 Wrangler 记录和应用迁移，不在请求中建表：

```txt
npm run db:generate
npm run db:migrate:local
npm run db:migrate:remote
npm run cf-typegen
```

本地迁移只影响 `.wrangler/state` 中的本地数据库；远端迁移才会更新 Cloudflare D1。`drizzle/` 中的 SQL 和元数据需纳入版本控制，不使用另一套 Drizzle 运行时迁移记录。

当前 `minibili` 数据库已创建，真实 ID 已配置到 `wrangler.jsonc`。在另一个账号重新部署时，先执行 `npx wrangler d1 create minibili` 并替换数据库 ID，再应用远端迁移、部署 Worker，最后更新客户端。

本次不迁移旧数据，不支持旧同步协议。`v1`、`v2` 仅保留为 Cloudflare 的资源生命周期记录；部署 `v3` 时删除 `UserStorage` 和 `UserDirectory` 两个旧 DO 类及其数据。新 Worker 没有 DO binding、类或 RPC 调用。

## 意见反馈限流

`POST /api/feedback` 使用 `RATE_LIMIT_FEEDBACK`，同一来源 IP 每 60 秒最多提交 3 次，超过时返回 `429` 和 `Retry-After: 60`。限流由 Cloudflare binding 完成，按节点计数、允许误差，不维护全局配额或数据库计数。反馈内容/图片校验及邮件发送流程保持原样。

## 用户管理页

`GET /users` 是由 Worker 直出的用户管理页，从 D1 查询用户昵称、B站 UID、当前 App 版本、首次登录时间和最近打开时间，按最近打开时间倒序排列。UID 可直接跳转到对应的 B站空间；`?q=<关键词>` 可按 UID 或昵称搜索。未上报版本时显示“未知”。时间来自服务端并按 `Asia/Shanghai` 显示，页面及认证失败响应均不缓存。

页面使用 HTTP Basic Auth，用户名固定为 `admin`。密码通过 `MINIBILI_MANAGEMENT_PASSWD` secret 注入，不能写入 `wrangler.jsonc`：

```txt
npx wrangler secret put MINIBILI_MANAGEMENT_PASSWD
```

本地开发将同名变量写入 `.env.local`（格式见 `.env.example`）。未配置密码时页面返回 `503`，无凭据或密码错误时返回 `401`，同一 IP 一分钟内认证失败超过 10 次返回 `429`（只有失败才计数，正常浏览与搜索不消耗配额）。`?q` 超过 64 字符的部分会被截断。

## 安全响应头

Worker 直出的所有响应（分享页、管理页、API、404）由 `worker/index.ts` 的中间件补齐 `X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`、`Strict-Transport-Security`、`X-Frame-Options`（仅 HTML）与只含 `frame-ancestors`/`base-uri`/`object-src`/`form-action` 的 CSP；已由 handler 设置的同名头优先。静态资源由 `public/_headers` 下发同一套头，只作用于静态资源响应。

## B 站请求中转（bili-proxy）

Worker 的出站 IP 会被 B 站风控直接拒绝（`412`/`403`），所以 server 里**没有任何直连 B 站的代码路径**：`/share` 的 `view`、`/x/relation/stat`，以及设置同步、启动登记的 `myinfo` 全部经 `bili-proxy` 子项目（部署在 Vercel，Node 运行时、区域 `hkg1`）转发。请求头（Referer / Cookie，以及刻意不发的 User-Agent）由 proxy 统一决定，Worker 只传 `path`、`profile` 与可选 `cookie`；改动 `bili-proxy/src/headers.ts` 前请先读那里的实测结论，否则很容易又触发 412。

需要配置：

- `BILIBILI_PROXY_URL`：proxy 地址，写在 `wrangler.jsonc` 的 `vars` 里（当前为 `https://bili-proxy-iota.vercel.app`）。
- `BILIBILI_PROXY_TOKEN`：与 Vercel 侧 `BILI_PROXY_TOKEN` 一致的共享密钥，用 `npx wrangler secret put BILIBILI_PROXY_TOKEN` 注入；本地开发写进 `.env.local`（已 gitignore）。

部署与冒烟步骤见 `bili-proxy/README.md`。上游失败时日志会输出 `[bili-proxy] ...`，带上 `path`、`profile`、`status`、`source`（`upstream` 表示 B 站返回、`relay` 表示 proxy 自身错误）与耗时，便于判断是风控还是代理故障。日志与缓存都不会包含 Cookie。
