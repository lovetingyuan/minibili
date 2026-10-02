import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const reactNativeStub = fileURLToPath(new URL("./test/react-native.js", import.meta.url));
const reanimatedStub = fileURLToPath(
  new URL("./test/react-native-reanimated.js", import.meta.url),
);
const safeAreaStub = fileURLToPath(
  new URL("./test/react-native-safe-area-context.js", import.meta.url),
);
const expoSecureStoreStub = fileURLToPath(
  new URL("./test/expo-secure-store.js", import.meta.url),
);
const expoCryptoStub = fileURLToPath(new URL("./test/expo-crypto.js", import.meta.url));
const expoApplicationStub = fileURLToPath(
  new URL("./test/expo-application.js", import.meta.url),
);
const expoUpdatesStub = fileURLToPath(new URL("./test/expo-updates.js", import.meta.url));
const expoFileSystemStub = fileURLToPath(
  new URL("./test/expo-file-system.js", import.meta.url),
);
const expoIntentLauncherStub = fileURLToPath(
  new URL("./test/expo-intent-launcher.js", import.meta.url),
);
const expoNotificationsStub = fileURLToPath(
  new URL("./test/expo-notifications.js", import.meta.url),
);
const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  define: {
    // Metro/Babel 会把 __DEV__ 编译进去，测试环境用固定值代替。
    __DEV__: "false",
  },
  resolve: {
    // 一些 RN 包的 `react-native` 字段指向 .ts/.tsx 源码，测试环境改用 main/module。
    mainFields: ["module", "main"],
    alias: {
      // 与 tsconfig 的 paths 保持一致：@/* -> src/*
      "@": srcDir,
      // react-native 源码是 Flow 语法，测试环境用替身代替。
      "react-native": reactNativeStub,
      "react-native-reanimated": reanimatedStub,
      "react-native-safe-area-context": safeAreaStub,
      "expo-application": expoApplicationStub,
      "expo-crypto": expoCryptoStub,
      "expo-file-system": expoFileSystemStub,
      "expo-intent-launcher": expoIntentLauncherStub,
      "expo-notifications": expoNotificationsStub,
      "expo-secure-store": expoSecureStoreStub,
      "expo-updates": expoUpdatesStub,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // 需要真实 B站 网络的集成用例（如 rank-list.live.test.ts）不参与默认离线测试。
    exclude: ["**/node_modules/**", "**/dist/**", "src/**/*.live.test.ts"],
    server: {
      deps: {
        // 这些包会连带加载 expo-modules-core / react-native 的 TS 源码，
        // 必须交给 Vite 转换，不能让 Node 直接按 ESM 解析（会报 typeof 语法错误）。
        inline: ["expo-modules-core", "@react-navigation/native"],
      },
    },
  },
});
