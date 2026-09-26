export const DEV_SERVER_PORT = 8787;
const DEFAULT_DEV_SERVER_HOST = "127.0.0.1";

/**
 * 开发期的接口地址跟着 Metro 走，而不是靠猜电脑的局域网 IP。
 *
 * Expo CLI 会把当前 Metro 的 `host:port` 写进 manifest 的 `hostUri`：
 * - `npm run dev` 以 `--localhost` 启动，hostUri 是 `127.0.0.1:8081`，
 *   配合 `adb reverse tcp:8787`（USB 与无线调试都支持）访问本机 server；
 * - 手动 `expo start --lan` 时是电脑的局域网 IP，此时手机需与电脑同网段。
 *
 * 无论哪种模式，这里推出的 host 都和 Metro 一致，不会出现「Metro 连得上、接口连不上」。
 */
export function resolveDevServerUrl(hostUri?: string | null): string {
  return `http://${resolveDevServerHost(hostUri)}:${DEV_SERVER_PORT}`;
}

type ExpoConstantsLike = { expoConfig?: { hostUri?: string } | null };
// 打包后的模块既有 `default` 导出，也可能直接被 require 成命名空间，两种形状都兼容
type ExpoConstantsModule = ExpoConstantsLike & { default?: ExpoConstantsLike | null };

/**
 * 读取 Metro 写进 manifest 的 hostUri。
 *
 * 这里用延迟 require 而不是顶层 `import expo-constants`：该包会连带加载 react-native，
 * 而 constants 被大量纯逻辑单测间接引用，顶层 import 会让这些单测都去解析 react-native。
 * 实际运行时（Metro / Expo CLI）require 可正常使用。
 */
export function readMetroHostUri(): string | undefined {
  try {
    const module = require("expo-constants") as ExpoConstantsModule | undefined;
    return (module?.default ?? module)?.expoConfig?.hostUri ?? undefined;
  } catch {
    return undefined;
  }
}

function resolveDevServerHost(hostUri?: string | null): string {
  const host = hostUri?.trim().replace(/:\d+$/, "");

  if (!host || host === "localhost") {
    // Android 上 localhost 可能先解析到 ::1，而 adb reverse 只监听 IPv4 回环
    return DEFAULT_DEV_SERVER_HOST;
  }

  return host;
}
