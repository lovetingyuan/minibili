# bili-proxy

部署在 **Vercel Node 运行时**的 B 站接口转发层。`minibili-server`（Cloudflare Worker）的出口 IP 会被 B 站风控直接拒绝，所以 Worker 不再直连 B 站，只调用本服务。

> Node 版本跟随项目的 **Project Settings → Node.js Version**（当前部署构建出来是 `nodejs24.x`）。不要写 `vercel.json` 的 `functions.runtime`：Vercel CLI 59 只接受带版本的 builder 写法，写 `nodejs22.x` 会直接报 `Function Runtimes must have a valid version`。

## 接口

```txt
POST /api/bili
x-proxy-token: <BILI_PROXY_TOKEN>
content-type: application/json

{ "path": "/x/web-interface/view?bvid=BV1XctB6PEuZ", "profile": "web" }
{ "path": "/x/space/v2/myinfo", "profile": "auth", "cookie": "SESSDATA=..." }
```

- `path` 只允许 `/x/web-interface/view`、`/x/web-interface/view/detail`、`/x/relation/stat`、`/x/space/v2/myinfo`，且必须落在 `https://api.bilibili.com`。
- `profile` 决定上游请求头：`web` 匿名、`auth` 带 cookie（cookie 只在此档位转发，不写日志、不缓存）。
- B 站的状态码与响应体原样返回，并带 `x-proxy-source: upstream`；本服务自身产生的错误统一 `{ "error": "<code>" }` + `x-proxy-source: relay`（405/401/500/400/403/413/502/504）。
- 上游超时预算：`web` 7s、`auth` 13s，都比 Worker 侧短，保证 Worker 拿到明确结果。

## 部署

```bash
cd bili-proxy
npm run vercel:login     # 首次，CLI 会自动装到仓库根的 tmp/vercel-cli
npm run vercel:link      # 首次，项目名用 bili-proxy
npm run vercel:env       # 写入 BILI_PROXY_TOKEN（值见下）
npm run deploy
```

也可以从仓库根目录执行 `npm run proxy:deploy`。

> 不要用 `npx vercel ...`。npm 11.6.2 在 workspace 子目录里执行 npx 时，
> 会因为 `node_modules/.package-lock.json` 中 workspace 软链的空 `version`
> 在 arborist 去重阶段抛 `npm error Invalid Version:`。`npm run vercel -- <args>`
> 是等价的替代入口，CLI 版本固定在 59.20.0（可用 `VERCEL_CLI_VERSION` 覆盖）。

注意事项：

- **必须使用 Node 运行时**：Edge Runtime 跑在 Cloudflare 网络上，等于没换出口。Node 版本跟随项目的 Node.js Version 设置（当前构建为 `nodejs24.x`），**不要**在 `vercel.json` 里写 `functions.runtime`——Vercel CLI 59 只接受带版本的 builder 写法，写 `nodejs22.x` 会报 `Function Runtimes must have a valid version`。
- 区域固定 `hkg1`（Hobby 计划只能单区域），香港离 Worker 的 NRT 出口最近。
- 生产域名不能开 Deployment Protection，否则 Worker 会拿到 401 页面；部署后用下面的冒烟命令确认。
- `BILI_PROXY_TOKEN` 需要与 Cloudflare 侧的 secret 完全一致：

  ```bash
  cd server
  npx wrangler secret put BILIBILI_PROXY_TOKEN
  ```

## 冒烟测试

```bash
curl -sS -i https://minibili-bili-proxy.vercel.app/api/bili \
  -H "content-type: application/json" \
  -H "x-proxy-token: $BILI_PROXY_TOKEN" \
  -d '{"path":"/x/web-interface/view?bvid=BV1XctB6PEuZ","profile":"web"}'
```

期望：HTTP 200、`x-proxy-source: upstream`、body 里业务 `code` 为 `0`。

如果这里返回 412/403，说明 Vercel 出口同样被 B 站风控：`src/` 里的逻辑与运行时无关，可以把同一套代码搬到一个国内出口的云函数（例如腾讯云 SCF + 函数 URL），Worker 侧只改 `BILIBILI_PROXY_URL` 与 secret。

## 开发

```bash
npm run test -w=@minibili/bili-proxy        # 单测
npm run typecheck -w=@minibili/bili-proxy   # 类型检查
npm run dev -w=@minibili/bili-proxy         # vercel dev
```
