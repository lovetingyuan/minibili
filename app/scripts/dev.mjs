#!/usr/bin/env node
// oxlint-disable no-console

/**
 * 本地开发脚本：先反代端口，再启动 dev-client 的 Metro。
 *
 * 1. 用 adb reverse 把设备侧的 127.0.0.1:8081（Metro）与 127.0.0.1:8787（本地 server）
 *    转发到本机。无线调试（adb pair / adb connect）与数据线连接在 adb 层面等价，
 *    两种连接方式都能反代，所以这个脚本同时适用于 USB 调试与无线调试。
 * 2. 默认以 `--localhost` 模式启动 Metro（透传参数里已有 `--lan`/`--tunnel` 时尊重用户选择）。
 *
 * app 侧的接口地址由 Metro 的 hostUri 在运行时推导（见 src/constants/dev-server-url.ts），
 * 因此这里既不读也不写 .env.local，也不需要猜电脑的局域网 IP。
 *
 * 用法：
 *   npm run dev                 // 反代 8081/8787，以 localhost 模式启动 Metro
 *   npm run dev -- --android    // 顺带在设备上拉起开发包
 *   npm run dev -- -p 8082      // 自定义 Metro 端口（反代端口同步）
 *   npm run dev -- --clear      // 清 Metro 缓存
 *   npm run dev -- --lan        // 不使用 localhost 模式（手机与电脑同网段时直连）
 *
 * 没有可用的 adb 设备时不报错：跳过反代，按 expo 默认的 LAN 模式启动。
 */

import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { createConnection } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_METRO_PORT = 8081;
// 需与 src/constants/dev-server-url.ts 的 DEV_SERVER_PORT、server/vite.config.ts 保持一致
const API_PORT = 8787;
const LOCAL_IP = "127.0.0.1";
const HOST_FLAGS = ["--localhost", "--lan", "--tunnel"];

const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  error: (message) => console.error(`[ERR] ${message}`),
};

// `adb devices` 输出形如：
//   List of devices attached
//   ZLXG6XCYOVGINBON	device product:... transport_id:1
function listDevices() {
  return execFileSync("adb", ["devices"], { encoding: "utf8" })
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((line) => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state };
    })
    .filter(({ serial, state }) => Boolean(serial) && Boolean(state));
}

function parseMetroPort(args) {
  for (const [index, arg] of args.entries()) {
    if (arg === "--port" || arg === "-p") {
      const value = args[index + 1];
      if (value && /^\d+$/.test(value)) {
        return Number(value);
      }
    } else {
      const matched = /^--port=(\d+)$/.exec(arg);
      if (matched) {
        return Number(matched[1]);
      }
    }
  }
  return DEFAULT_METRO_PORT;
}

// 成功返回 null，失败返回错误信息。
function reversePort(serial, port) {
  try {
    execFileSync("adb", ["-s", serial, "reverse", `tcp:${port}`, `tcp:${port}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return null;
  } catch (error) {
    return error.stderr?.trim() || error.message;
  }
}

function removeReversePort(serial, port) {
  spawnSync("adb", ["-s", serial, "reverse", "--remove", `tcp:${port}`], { stdio: "ignore" });
}

// `adb reverse --list` 每行形如 `UsbFfs tcp:8081 tcp:8081`（设备侧端口在前）。
// 记下来是为了退出时只回滚本次新增的反代，不动这个设备上原有的反代。
function listReversedPorts(serial) {
  try {
    const output = execFileSync("adb", ["-s", serial, "reverse", "--list"], { encoding: "utf8" });
    return new Set(
      output
        .split(/\r?\n/)
        .map((line) => /tcp:(\d+)\s+tcp:\d+/.exec(line))
        .filter((matched) => matched !== null)
        .map((matched) => matched[1]),
    );
  } catch {
    return new Set();
  }
}

// 端口被占用时 Expo 会提示换端口，但反代仍指向原端口，dev client 就会连不上，
// 所以这里直接拦住，让用户先停掉旧 Metro 或显式指定端口。
function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: LOCAL_IP, port });
    const finish = (inUse) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(inUse);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

// 没有就绪设备时返回原因，用来决定是否跳过反代。
function listReadyDevices() {
  let devices;
  try {
    devices = listDevices();
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        ready: [],
        reason: "未找到 adb 命令，请安装 Android platform-tools 并把它加入 PATH",
      };
    }
    return { ready: [], reason: `执行 adb devices 失败：${error.stderr?.trim() || error.message}` };
  }

  if (devices.length === 0) {
    return { ready: [], reason: "未检测到已连接的 Android 设备", showTips: true };
  }

  const ready = devices.filter(({ state }) => state === "device");
  if (ready.length === 0) {
    const summary = devices.map(({ serial, state }) => `${serial}(${state})`).join(", ");
    return { ready: [], reason: `已连接的设备都没有就绪：${summary}`, showTips: true };
  }

  return { ready, reason: null, showTips: false };
}

function printDeviceTips() {
  console.log(`
请依次检查：
  1. USB 调试：用数据线连接手机（部分线材只能供电，不能传数据），
     在「开发者选项」里打开 USB 调试，手机弹出「允许 USB 调试吗」时点允许；
  2. 无线调试：开发者选项 → 无线调试，用 adb pair <ip>:<port> 配对后再 adb connect <ip>:<port>；
  3. 执行 adb devices，设备状态是 device 才算就绪（unauthorized 表示未授权，offline 表示需要重连）。
`);
}

function resolveExpoCli() {
  try {
    return createRequire(import.meta.url).resolve("expo/bin/cli");
  } catch {
    log.error("找不到 expo CLI，请先在仓库根目录执行 npm install");
    process.exit(1);
  }
}

async function reverseForDevices(ready, metroPort) {
  // 端口被占用说明手机上旧的 Metro 还活着，反代过去也连不上新 Metro
  if (await isPortInUse(metroPort)) {
    log.error(`本机 ${LOCAL_IP}:${metroPort} 已被占用，可能已经有一个 Metro 在运行`);
    console.log(`
请先停掉占用该端口的进程，或换个端口启动（反代端口会同步）：
  npm run dev -- -p 8082
`);
    process.exit(1);
  }

  const reversed = [];
  const failures = [];
  for (const { serial } of ready) {
    const existingPorts = listReversedPorts(serial);
    const errors = [metroPort, API_PORT]
      .map((port) => ({ port, message: reversePort(serial, port) }))
      .filter(({ message }) => message !== null);

    if (errors.length === 0) {
      const added = [metroPort, API_PORT].filter((port) => !existingPorts.has(String(port)));
      reversed.push({ serial, added });
    } else {
      for (const { port, message } of errors) {
        failures.push(`${serial} tcp:${port}: ${message}`);
      }
    }
  }

  if (reversed.length === 0) {
    log.error("adb reverse 全部失败，未启动 Metro");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }

  if (failures.length > 0) {
    log.warn("以下设备/端口反代失败，其余设备不受影响");
    for (const failure of failures) {
      console.warn(`  - ${failure}`);
    }
  }

  return reversed;
}

function startMetro(forwardedArgs, shouldUseLocalhost, reversed) {
  // 反代由本脚本收回：实测 Expo CLI 自己的退出钩子并不总能清掉 Metro 端口。
  // 只回滚本次新增的端口，设备上原有的反代保持不动。
  let cleaned = false;
  process.on("exit", () => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    for (const { serial, added } of reversed) {
      for (const port of added) {
        removeReversePort(serial, port);
      }
    }
  });

  // Windows 上 Node 默认把 localhost 解析成 ::1，Metro 于是只监听 IPv6 回环，
  // 而 adb reverse 是把流量送回宿主机的 127.0.0.1（IPv4），设备侧会连接被拒。
  // 这里强制 ipv4first，让 --localhost 真的绑在 IPv4 回环上。
  const nodeOptions = [process.env.NODE_OPTIONS, "--dns-result-order=ipv4first"]
    .filter(Boolean)
    .join(" ");

  const expoArgs = [
    "start",
    "--dev-client",
    ...(shouldUseLocalhost ? ["--localhost"] : []),
    ...forwardedArgs,
  ];

  const child = spawn(process.execPath, [resolveExpoCli(), ...expoArgs], {
    cwd: APP_DIR,
    // 开发包是用 APP_VARIANT=development 构建的（MiniBili-dev / com.tingyuan.minibili.dev，见 eas.json
    // 与 scripts/build-android-local.mjs），Metro 这边保持同一个变体，dev-client 里显示的项目名才一致。
    env: { ...process.env, NODE_OPTIONS: nodeOptions, APP_VARIANT: "development" },
    stdio: "inherit",
  });

  child.on("error", (error) => {
    log.error(`启动 Metro 失败：${error.message}`);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

async function main() {
  const forwardedArgs = process.argv.slice(2);
  const metroPort = parseMetroPort(forwardedArgs);
  const shouldUseLocalhost = !forwardedArgs.some((arg) => HOST_FLAGS.includes(arg));

  const { ready, reason, showTips } = listReadyDevices();
  let reversed = [];

  if (ready.length === 0) {
    log.warn(`${reason}，跳过 adb 反代`);
    if (showTips) {
      printDeviceTips();
    }
    log.warn("Metro 将以默认（LAN）模式启动，手机需要与电脑处于同一网段");
  } else {
    reversed = await reverseForDevices(ready, metroPort);
    log.info(
      `已反代 tcp:${metroPort}（Metro）与 tcp:${API_PORT}（本地 server）：${reversed
        .map(({ serial }) => serial)
        .join(", ")}`,
    );
  }

  if (shouldUseLocalhost) {
    log.info(`Metro 将以 localhost 模式启动，dev client 请打开 http://${LOCAL_IP}:${metroPort}`);
  } else {
    log.info("Metro 将以 LAN 模式启动（你已显式指定 host 参数）");
  }
  log.info("接口调试依赖本地 server，请另开终端执行 npm run server");

  startMetro(forwardedArgs, shouldUseLocalhost, reversed);
}

main().catch((error) => {
  log.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
