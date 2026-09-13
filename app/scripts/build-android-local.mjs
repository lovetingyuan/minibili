#!/usr/bin/env node
// oxlint-disable no-console

// 本地 debug 开发包构建脚本（仅用于 Linux）。
//
// 最耗时的一环是原生编译：`expo prebuild` 默认会清空 android/ 目录，构建产物全部丢失，
// 于是每次构建都要从零重编一遍 C++（RN / Hermes / 各原生模块）。实测 `--no-clean` 是幂等的
// （配置不变时生成的文件内容完全一致，只有 mtime 变了），所以这里始终增量同步原生工程，
// 只在首次生成或显式指定 BUILD_CLEAN_PREBUILD=1 时重建目录，让 Gradle 的增量编译真正生效。
//
// 其它优化：
//   - prebuild 内部还会再装一遍依赖，用 --no-install 跳过，依赖统一由脚本开头安装；
//   - Gradle 开启 build cache，并发与堆内存按本机 CPU / 内存自动取值（8G 级别的小机器仍走保守设置）；
//   - 这些 Gradle 参数写进 android/gradle.properties（prebuild 会重新生成该文件，所以每次构建前重写）。
//
// 环境变量：
//   BUILD_ARCHITECTURES=x86_64  只编译指定 ABI（默认 arm64-v8a，模拟器用 x86_64）
//   BUILD_CLEAN_PREBUILD=1      彻底重建原生工程（android/ 状态异常时用）
//   BUILD_MAX_WORKERS=4         Gradle --max-workers
//   BUILD_PARALLEL=0            关闭 Gradle 并行（默认按机器内存自动决定）
//   BUILD_SKIP_INSTALL=1        跳过 npm install

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(APP_DIR, "..");
const ANDROID_DIR = join(APP_DIR, "android");
const GRADLE_PROPERTIES = join(ANDROID_DIR, "gradle.properties");
const GRADLEW = join(ANDROID_DIR, "gradlew");
const APK_SOURCE = join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const APK_DIR = join(APP_DIR, "apk");

// RN/Expo 会为每个 ABI 分别编译一遍 C++，四架构全开是构建期内存占用的最大来源，
// 本地开发包默认只编真机需要的 arm64-v8a。需要模拟器包时：
//   BUILD_ARCHITECTURES=x86_64 npm run build:dev
const ARCHITECTURES = process.env.BUILD_ARCHITECTURES ?? "arm64-v8a";
const CLEAN_PREBUILD = process.env.BUILD_CLEAN_PREBUILD === "1";
const SKIP_INSTALL = process.env.BUILD_SKIP_INSTALL === "1";

// 机器规格自适应：内存小于 10G 的机器沿用原来的保守参数，避免构建时被 OOM killer 干掉；
// 内存充裕的机器放开并发和堆，把 CPU 用满。
const TOTAL_MEMORY_GIB = os.totalmem() / 1024 ** 3;
const LOW_MEMORY_MACHINE = TOTAL_MEMORY_GIB < 10;
const MAX_WORKERS = Number(
  process.env.BUILD_MAX_WORKERS ??
    (LOW_MEMORY_MACHINE ? 2 : Math.max(2, Math.min(6, Math.floor(os.cpus().length / 4)))),
);
const PARALLEL = (process.env.BUILD_PARALLEL ?? (LOW_MEMORY_MACHINE ? "0" : "1")) === "1";
const HEAP_MB = LOW_MEMORY_MACHINE
  ? 2048
  : Math.min(6144, Math.max(2048, Math.round(TOTAL_MEMORY_GIB * 256)));
const METASPACE_MB = LOW_MEMORY_MACHINE ? 512 : 1024;
const JVM_ARGS = `-Xmx${HEAP_MB}m -XX:MaxMetaspaceSize=${METASPACE_MB}m`;

const timings = [];

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function formatDuration(milliseconds) {
  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  return `${Math.floor(seconds / 60)}m${Math.round(seconds % 60)}s`;
}

function step(label, task) {
  console.log(`[INFO] ${label}...`);
  const start = Date.now();
  task();
  const cost = Date.now() - start;
  timings.push({ cost, label });
  console.log(`[TIME] ${label}: ${formatDuration(cost)}`);
}

function androidProjectExists() {
  return existsSync(join(ANDROID_DIR, "settings.gradle")) && existsSync(GRADLEW);
}

function upsertGradleProperty(key, value) {
  const pattern = new RegExp(`^\\s*${key.replaceAll(".", "\\.")}\\s*=`);
  const lines = readFileSync(GRADLE_PROPERTIES, "utf8").split(/\r?\n/);
  const index = lines.findIndex((line) => pattern.test(line));
  const next = `${key}=${value}`;

  if (index === -1) {
    lines.push(next);
  } else {
    lines[index] = next;
  }

  writeFileSync(GRADLE_PROPERTIES, lines.join("\n"));
}

// prebuild 每次都会重新生成 gradle.properties，所以构建前要重新写一遍这些参数。
// 写进 android/gradle.properties 而不是依赖用户级 ~/.gradle/gradle.properties，脚本才是自包含的。
function tuneGradleProperties() {
  upsertGradleProperty("org.gradle.jvmargs", JVM_ARGS);
  upsertGradleProperty("org.gradle.parallel", PARALLEL ? "true" : "false");
  upsertGradleProperty("org.gradle.caching", "true");
  upsertGradleProperty("org.gradle.workers.max", String(MAX_WORKERS));
  upsertGradleProperty("reactNativeArchitectures", ARCHITECTURES);
}

function installDependencies() {
  // npm install 本身是增量的，依赖没变化时只有 1~2s，所以每次构建都跑一遍保证依赖最新。
  run("npm", ["install", "--no-audit", "--no-fund", "--prefer-offline"], REPO_ROOT);
}

function prepareAndroidProject() {
  const clean = CLEAN_PREBUILD || !androidProjectExists();

  if (clean) {
    console.log("[INFO] 重建原生工程（android/ 不存在或指定了 BUILD_CLEAN_PREBUILD=1）");
  } else {
    console.log("[INFO] 增量同步原生工程（--no-clean，保留 android/ 里的构建产物）");
  }

  const args = ["expo", "prebuild", "--platform", "android", "--no-install"];
  if (!clean) {
    args.push("--no-clean");
  }

  run("npx", args, APP_DIR);
}

function buildDebugApk() {
  tuneGradleProperties();

  // prebuild 生成的文件在不同平台/机器上不一定带执行位，这里顺手补一下，避免 EACCES。
  try {
    chmodSync(GRADLEW, 0o755);
  } catch {
    // 权限调整失败就让 gradlew 自己去报错
  }

  const args = [
    ":app:assembleDebug",
    `-PreactNativeArchitectures=${ARCHITECTURES}`,
    `--max-workers=${MAX_WORKERS}`,
    "--build-cache",
    "-Pkotlin.compiler.execution.strategy=in-process",
  ];
  if (!PARALLEL) {
    args.push("--no-parallel");
  }

  run(GRADLEW, args, ANDROID_DIR);
}

// 构建产物名带上日期和时分，避免同一天多次构建互相覆盖。
function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `${day}-${time}`;
}

function copyApk() {
  if (!existsSync(APK_SOURCE)) {
    throw new Error(`未找到构建产物: ${APK_SOURCE}`);
  }

  mkdirSync(APK_DIR, { recursive: true });
  const { version } = JSON.parse(readFileSync(join(APP_DIR, "package.json"), "utf8"));
  const apkPath = join(APK_DIR, `minibili-${version}-dev-${formatTimestamp(new Date())}.apk`);
  copyFileSync(APK_SOURCE, apkPath);

  const size = (statSync(apkPath).size / 1024 ** 2).toFixed(1);
  console.log(`[OK] 开发包已生成: ${apkPath} (${size} MB)`);
}

function main() {
  console.log(
    `[INFO] 本机 ${os.cpus().length} 线程 / ${TOTAL_MEMORY_GIB.toFixed(1)}G 内存 => ` +
      `workers=${MAX_WORKERS}，并行=${PARALLEL ? "on" : "off"}，Gradle 堆=${HEAP_MB}m，ABI=${ARCHITECTURES}`,
  );

  const totalStart = Date.now();

  if (SKIP_INSTALL) {
    console.log("[INFO] BUILD_SKIP_INSTALL=1，跳过 npm install");
  } else {
    step("安装依赖", installDependencies);
  }

  step("准备 Android 原生工程", prepareAndroidProject);
  step("编译 debug 开发包", buildDebugApk);
  copyApk();

  const detail = timings.map(({ cost, label }) => `${label} ${formatDuration(cost)}`).join(" / ");
  console.log(`[OK] 总耗时 ${formatDuration(Date.now() - totalStart)}（${detail}）`);
}

try {
  main();
} catch (error) {
  console.error("[ERR]", error instanceof Error ? error.message : error);
  process.exit(1);
}
