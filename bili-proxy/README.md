# bili-proxy

部署在 **Vercel Node 运行时**的 B 站接口转发层（生产地址：<https://bili-proxy-iota.vercel.app>，区域 `hkg1`）。`minibili-server`（Cloudflare Worker）的出口 IP 会被 B 站风控直接拒绝，所以 Worker 不再直连 B 站，只调用本服务。

> Node 版本跟随项目的 **Project Settings → Node.js Version**（当前部署构建出来是 `nodejs24.x`）。不要写 `vercel.json` 的 `functions.runtime`：Vercel CLI 59 只接受带版本的 builder 写法，写 `nodejs22.x` 会直接报 `Function Runtimes must have a valid version`。

## 接口

```txt
POST /api/bili
x-proxy-token: <BILI_PROXY_TOKEN>
content-type: application/json

{ "path": "/x/web-interface/view?bvid=BV1XctB6PEuZ", "profile": "web" }
{ "path": "/x/space/v2/myinfo", "profile": "auth", "cookie": "SESSDATA=..." }
```

- `path` 只允许 `/x/web-interface/view`、`/x/relation/stat`、`/x/space/v2/myinfo`，且必须落在 `https://api.bilibili.com`。（`/x/web-interface/view/detail` 在机房出口上会被风控返回 412，故未纳入白名单。）
- `profile` 决定上游请求头：`web` 匿名、`auth` 带 cookie（cookie 只在此档位转发，不写日志、不缓存）。
- B 站的状态码与响应体原样返回，并带 `x-proxy-source: upstream`；本服务自身产生的错误统一 `{ "error": "<code>" }` + `x-proxy-source: relay`（405/401/500/400/403/413/502/504）。
- 上游超时预算：`web` 7s、`auth` 13s，都比 Worker 侧短，保证 Worker 拿到明确结果。
- **上游请求刻意不发 `User-Agent`**：在 hkg1 出口上逐个 header 组合实测，只要带 UA（Chrome、`Mozilla/5.0`、安卓 App UA、带 `sec-ch-ua` 的完整浏览器头都一样）就返回 `412 request was banned`；不带 UA 或带 `curl/…` 这种非浏览器 UA 才稳定 200。原因是机房 IP 上「自称浏览器但 TLS 指纹不是浏览器」本身就是风控特征。要动 `src/headers.ts` 时请先跑一遍冒烟。

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
- **`package.json` 必须有 `"type": "module"`**：Vercel 只做逐文件转译，输出的 `api/bili.js` 仍是 ESM 语法；缺了这个字段 Node 会按 CJS 解析，线上直接 `SyntaxError: Cannot use import statement outside a module`（表现为 500）。相应地，`src/` 与 `api/` 之间的相对导入都写成 `./x.js`。
- 区域固定 `hkg1`（Hobby 计划只能单区域），香港离 Worker 的 NRT 出口最近。
- 生产域名不能开 Deployment Protection，否则 Worker 会拿到 401 页面；部署后用下面的冒烟命令确认。
- **`npm run deploy` 会在仓库外的临时目录部署**：Vercel Hobby 要求 commit 作者必须是团队 owner（本地 commit 是 GitHub noreply 邮箱、Vercel 账号是别的邮箱且未连 GitHub 时会命中），否则部署被 `BLOCKED`（`readyStateReason: commit author doesn't have permission to create deployments`）。脚本因此把源码复制到系统临时目录再部署，剥离 git 元数据；在 Vercel 里连上 GitHub（Account Settings → Login Connections）后可以用 `BILI_PROXY_DEPLOY_IN_PLACE=1 npm run deploy` 恢复就地部署。
- `BILI_PROXY_TOKEN` 需要与 Cloudflare 侧的 secret 完全一致：

  ```bash
  cd server
  npx wrangler secret put BILIBILI_PROXY_TOKEN
  ```

## 冒烟测试

```bash
curl -sS -i https://bili-proxy-iota.vercel.app/api/bili \
  -H "content-type: application/json" \
  -H "x-proxy-token: $BILI_PROXY_TOKEN" \
  -d '{"path":"/x/web-interface/view?bvid=BV1XctB6PEuZ","profile":"web"}'
```

期望：HTTP 200、`x-proxy-source: upstream`、body 里业务 `code` 为 `0`。

如果这里返回 412/403，先按上面的 UA 结论排查请求头（这是本项目实际踩到的唯一原因）。若确认是该出口整体被封（换 header、换 URL 都 412），`src/` 的逻辑与运行时无关，可以把同一套代码搬到国内出口的云函数（例如腾讯云 SCF + 函数 URL），Worker 侧只改 `BILIBILI_PROXY_URL` 与 secret。

## 开发

```bash
npm run test -w=@minibili/bili-proxy        # 单测
npm run typecheck -w=@minibili/bili-proxy   # 类型检查
npm run dev -w=@minibili/bili-proxy         # vercel dev
```
