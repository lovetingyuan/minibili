```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```

## 用户设置同步

`POST /api/user-data/sync` 接受 `{ get?: string[], set?: Record<string, JsonValue>, delete?: string[] }`，返回 `{ success: true, uid: string, result: Record<string, JsonValue> }`。未存储的 key 不出现在结果中。同一请求按删除、写入、读取的顺序原子执行。

请求使用 `X-Bilibili-Cookie` 携带 B站登录 Cookie。服务端每次向 B站验证身份，只使用响应中的 UID 调用 `USER_STORAGE.getByName(uid)`；验证失败前不访问 DO。没有独立账号、验证码或 token，也不在 DO 保存 Cookie。生产环境必须通过 HTTPS 访问，不允许重定向凭证。

请求体最多 128 KiB、最多 128 个不同 key。Key 为 1–128 个 ASCII 字母、数字、下划线、`$`、`:`、`.` 或 `-`，禁止 `__proto__`、`constructor`、`prototype`。Value 为 JSON，最多嵌套 32 层。当前客户端同步 `$blackTags`、`$videoCatesList` 和 `$pinnedUpIds`，服务端不维护业务字段白名单。

`$pinnedUpIds` 是去重后的 UP 主 MID 字符串数组，按置顶顺序排列，首项最靠前，默认值为 `[]`。置顶将 ID 移至首位，取消置顶移除 ID；全部取消时写入空数组。不在当前关注列表中的 ID 暂不展示，保留其置顶记录供再次关注后恢复。旧关注缓存中的置顶数据不迁移。

状态码：格式错误 `400`，登录缺失/失效 `401`，请求过大 `413`，B站暂不可验证或存储失败 `503`。所有同步响应均禁止缓存。邮箱接口已移除，旧版数据不迁移。

游客、本地账号缓存和待同步修改分别隔离存储。有效登录时自动同步，失败保留修改；切换账号不会上传游客或其他账号的数据。同一 key 采用最后成功写入的值。
