#!/usr/bin/env node
// oxlint-disable no-console

// 本机内存只有 8G，构建时需要主动压制并发和内存占用，否则会被系统 OOM killer 干掉。
// JVM 堆大小写在 ~/.gradle/gradle.properties（用户级配置优先级高于项目级，
// 且 `expo prebuild` 每次都会重新生成 android/ 目录，写进 android/gradle.properties 会被丢掉）。

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(APP_DIR, "..");
const ANDROID_DIR = join(APP_DIR, "android");
const APK_SOURCE = join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const APK_DIR = join(APP_DIR, "apk");

const isWindows = process.platform === "win32";
const npx = isWindows ? "npx.cmd" : "npx";
const npm = isWindows ? "npm.cmd" : "npm";
const gradlew = isWindows ? "gradlew.bat" : "./gradlew";

// RN/Expo 会为每个 ABI 分别编译一遍 C++，四架构全开是构建期内存占用的最大来源，
// 本地开发包默认只编真机需要的 arm64-v8a。需要模拟器包时：
//   BUILD_ARCHITECTURES=x86_64 npm run build:dev
const ARCHITECTURES = process.env.BUILD_ARCHITECTURES ?? "arm64-v8a";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: isWindows,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// 构建产物名带上日期和时分，避免同一天多次构建互相覆盖。
function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `${day}-${time}`;
}

function main() {
  console.log("[INFO] 安装依赖...");
  run(npm, ["install"], REPO_ROOT);

  console.log("[INFO] 生成 Android 原生工程...");
  run(npx, ["expo", "prebuild", "--platform", "android"], APP_DIR);

  console.log("[INFO] 编译 debug 开发包...");
  run(
    gradlew,
    [
      ":app:assembleDebug",
      `-PreactNativeArchitectures=${ARCHITECTURES}`,
      "--max-workers=2",
      "--no-parallel",
      "-Pkotlin.compiler.execution.strategy=in-process",
    ],
    ANDROID_DIR,
  );

  mkdirSync(APK_DIR, { recursive: true });
  const { version } = JSON.parse(readFileSync(join(APP_DIR, "package.json"), "utf8"));
  const apkPath = join(APK_DIR, `minibili-${version}-dev-${formatTimestamp(new Date())}.apk`);
  copyFileSync(APK_SOURCE, apkPath);

  console.log(`[OK] 开发包已生成: ${apkPath}`);
}

try {
  main();
} catch (error) {
  console.error("[ERR]", error instanceof Error ? error.message : error);
  process.exit(1);
}
