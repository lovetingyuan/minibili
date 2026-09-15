# MiniBili

The minimum bilibili app.
(Android 6 or above)
简单的B站浏览APP，欢迎下载使用

<img src="./docs/minibili.png" alt="minibili" width="280" >

<img src="./docs/video-list.jpg" alt="video list" width="320" style="margin-right: 20px"> <img src="./docs/player.jpg" alt="player" width="320" style="margin-right: 20px">

---

<img src="./docs/up-list.jpg" alt="up list" width="320" style="margin-right: 20px"> <img src="./docs/up-detail.jpg" alt="up detail" width="320" style="margin-right: 20px">

下载: https://minibili.tingyuan.in/

Developed with Expo, React-Native and TailwindCSS.

Thanks https://socialsisteryi.github.io/bilibili-API-collect/

## Hot Update

Use EAS Update directly from the `app` workspace.

In `app`:

```bash
npm run update -- --message "your update message"
```

From the repo root:

```bash
npm run update -w=@minibili/app -- --message "your update message"
```

This publishes to the `production` channel for `android` with the `production` EAS environment.

## 本地开发（USB 调试 / 无线调试）

接口调试依赖本地 server，先在一个终端启动它：

```bash
npm run server
```

再在另一个终端启动 app 的开发服务（USB 与无线调试在 adb 层等价，这里用同一条命令）：

```bash
npm run dev
```

- 需要已安装 Android platform-tools（`adb` 在 PATH 中），并且已在「开发者选项」里打开 USB 调试（数据线连接，手机弹窗点允许）或无线调试（`adb pair <ip>:<port>` 配对后再 `adb connect <ip>:<port>`）；`adb devices` 中状态为 `device` 才算就绪。
- 命令会把手机的 `127.0.0.1:8081`（Metro）与 `127.0.0.1:8787`（本地 server）反代到电脑，再以 `--localhost` 模式启动 dev-client 的 Metro；手机上打开已安装的开发包即可，不要求电脑与手机处于同一网段。
- app 的接口地址由 Metro 的 host 在运行时推导（见 `app/src/constants/dev-server-url.ts`），不需要配置电脑的局域网 IP，也没有 `.env.local`。
- 没有可用的 adb 设备时不会报错：命令会跳过反代，改用 expo 默认的 LAN 模式启动，此时手机需要与电脑处于同一网段。
- 本机 8081 已被占用时（例如还开着另一个 Metro）命令会直接报错，先停掉旧 Metro，或用 `-p` 指定别的端口。
- 参数会原样透传给 `expo start`：`npm run dev -- --android`（自动拉起手机上的开发包）、`npm run dev -- --clear`（清缓存）、`npm run dev -- -p 8082`（自定义 Metro 端口，反代端口同步）、`npm run dev -- --lan`（不使用 localhost 模式）。
- 实际使用的接口地址可以在 app 的「关于 → 版本信息」弹窗里看到（仅开发构建）。
