```txt
npm install
npm run dev
```

开发服务器（`vite`）监听 `0.0.0.0:8787`，与 app 的 `EXPO_PUBLIC_IPV4:8787` 对应。Worker 处理 `/share`、`/share.html`、`/api/*` 与 `/health`，其余路径由静态资源与 SPA 回退处理。

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

- `bvid` 缺失或非法返回 `400`；B站返回视频不存在（`-404`）时返回 `404`；上游超时、风控或结构异常时返回 `502`。三种失败都只输出精简错误页（站头站尾 + 错误卡片 + 重新加载链接），不嵌播放器，且响应不缓存。
- `p` 非正整数或超出分片数量时按第 1 个分片处理，`cid` 与时长也跟随实际生效的分片。
- 取数只读、匿名可用，不携带任何 Cookie；上游请求带浏览器 UA 与 Referer，并使用 300 秒边缘缓存，页面响应头为 `Cache-Control: public, max-age=300`。UP 主粉丝数来自 `/x/relation/stat`，取不到时为 `null`。

## 用户设置同步

`POST /api/user-data/sync` 接受 `{ get?: string[], set?: Record<string, JsonValue>, delete?: string[] }`，返回 `{ success: true, uid: string, result: Record<string, JsonValue> }`。未存储的 key 不出现在结果中。同一请求按删除、写入、读取的顺序原子执行。

请求使用 `X-Bilibili-Cookie` 携带 B站登录 Cookie。服务端每次向 B站验证身份，只使用响应中的 UID 调用 `USER_STORAGE.getByName(uid)`；验证失败前不访问 DO。没有独立账号、验证码或 token，也不在 DO 保存 Cookie。生产环境必须通过 HTTPS 访问，不允许重定向凭证。

请求体最多 128 KiB、最多 128 个不同 key。Key 为 1–128 个 ASCII 字母、数字、下划线、`$`、`:`、`.` 或 `-`，禁止 `__proto__`、`constructor`、`prototype`。Value 为 JSON，最多嵌套 32 层。当前客户端同步 `$blackTags`、`$videoCatesList` 和 `$pinnedUpIds`，服务端不维护业务字段白名单。

`$pinnedUpIds` 是去重后的 UP 主 MID 字符串数组，按置顶顺序排列，首项最靠前，默认值为 `[]`。置顶将 ID 移至首位，取消置顶移除 ID；全部取消时写入空数组。不在当前关注列表中的 ID 暂不展示，保留其置顶记录供再次关注后恢复。旧关注缓存中的置顶数据不迁移。

状态码：格式错误 `400`，登录缺失/失效 `401`，请求过大 `413`，B站暂不可验证或存储失败 `503`。所有同步响应均禁止缓存。邮箱接口已移除，旧版数据不迁移。

游客、本地账号缓存和待同步修改分别隔离存储。有效登录时自动同步，失败保留修改；切换账号不会上传游客或其他账号的数据。同一 key 采用最后成功写入的值。
