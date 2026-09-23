#!/usr/bin/env node
// oxlint-disable no-console

// 本地 Android 构建脚本（仅用于 Linux），支持 dev / preview 两个变体：
//   node scripts/build-android-local.mjs [dev|preview]   （缺省 dev）
//
// 两个变体最耗时的一环都是原生编译：`expo prebuild` 默认会清空 android/ 目录，构建产物全部丢失，
// 于是每次构建都要从零重编一遍 C++（RN / Hermes / 各原生模块）。实测 `--no-clean` 是幂等的
// （配置不变时生成的文件内容完全一致，只有 mtime 变了），所以这里始终增量同步原生工程，
// 只在首次生成或显式指定 BUILD_CLEAN_PREBUILD=1 时重建目录。
//
// 两个变体的 applicationId / 应用名不同（dev 是 com.tingyuan.minibili.dev，preview 是
// com.tingyuan.minibili.preview），没法共用一份 android/，所以脚本把当前不用的那份改名存到
// .native-build/<变体>/android，切回来时再改名回来，这样两边的 Gradle 增量产物都能长期保留，
// 切换只需毫秒级的目录改名。
//
// 其它优化：
//   - prebuild 内部还会再装一遍依赖，用 --no-install 跳过，依赖统一由脚本开头安装；
//   - Gradle 开启 build cache，并发与堆内存按本机 CPU / 内存自动取值（8G 级别的小机器仍走保守设置）；
//   - preview 是 release 构建，额外关掉只在 release 跑的 PNG 重压缩；
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
  renameSync,
  rmSync,
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
const APK_DIR = join(APP_DIR, "apk");
const NATIVE_CACHE_DIR = join(APP_DIR, ".native-build");

const VARIANTS = {
  dev: {
    // APP_VARIANT=development 让 app.config.js 走开发变体（MiniBili-dev / com.tingyuan.minibili.dev）
    appVariant: "development",
    apkSource: join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    apkSuffix: "dev",
    gradleTask: ":app:assembleDebug",
    name: "dev 开发包",
  },
  preview: {
    appVariant: "preview",
    apkSource: join(ANDROID_DIR, "app", "build", "outputs", "apk", "release", "app-release.apk"),
    apkSuffix: "preview",
    gradleTask: ":app:assembleRelease",
    name: "preview 预览包",
  },
};

// RN/Expo 会为每个 ABI 分别编译一遍 C++，四架构全开是构建期内存占用的最大来源，
// 本地包默认只编真机需要的 arm64-v8a。需要模拟器包时：
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

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });

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

function resolveVariant() {
  const variant = process.argv[2] ?? "dev";
  if (!Object.hasOwn(VARIANTS, variant)) {
    throw new Error(
      `未知的变体 ${variant}，用法：node scripts/build-android-local.mjs [${Object.keys(VARIANTS).join("|")}]`,
    );
  }
  return variant;
}

// APP_VARIANT 是 app.config.js 判断包名/应用名的开关，prebuild 与 Gradle（打包时会重新读 app.config）
// 必须用同一份值。这里显式覆盖而不是沿用外部环境，避免外部设的 APP_VARIANT 漏进来。
// Gradle 会把环境变量纳入 daemon 匹配，所以这里的值一定能传到打包进程。
function buildVariantEnv(appVariant) {
  return { ...process.env, APP_VARIANT: appVariant };
}

function androidProjectExists() {
  return existsSync(join(ANDROID_DIR, "settings.gradle")) && existsSync(GRADLEW);
}

function nativeCachePath(variant) {
  return join(NATIVE_CACHE_DIR, variant, "android");
}

// 变体判断只看生成的 applicationId：app.config.js 给非生产变体分别加了 .dev / .preview 后缀，
// 生产变体（com.tingyuan.minibili）不属于任何一个本地构建变体，返回 null 交给调用方重建。
function detectActiveVariant() {
  const buildGradle = join(ANDROID_DIR, "app", "build.gradle");
  if (!existsSync(buildGradle)) {
    return null;
  }

  const matched = readFileSync(buildGradle, "utf8").match(/applicationId\s+['"]([^'"]+)['"]/);
  if (!matched) {
    return null;
  }
  if (matched[1].endsWith(".dev")) {
    return "dev";
  }
  return matched[1].endsWith(".preview") ? "preview" : null;
}

function stowAndroidDir(variant) {
  const cachePath = nativeCachePath(variant);
  mkdirSync(dirname(cachePath), { recursive: true });
  if (existsSync(cachePath)) {
    // 同名缓存已经不是当前目录的内容（属于更老的一次构建），直接丢掉
    rmSync(cachePath, { force: true, recursive: true });
  }
  renameSync(ANDROID_DIR, cachePath);
  console.log(`[INFO] 已把 ${variant} 的原生工程暂存到 ${cachePath}`);
}

// 让 android/ 里的原生工程匹配目标变体，必要时与 .native-build 里的缓存互换。
// 返回 "active"（本来就是这个变体）、"restored"（从缓存切回来）、"fresh"（还没有）、
// "unknown"（现有目录识别不出来，交给 clean prebuild 重建）。
function activateVariant(variant) {
  if (!androidProjectExists()) {
    const cachePath = nativeCachePath(variant);
    if (existsSync(cachePath)) {
      mkdirSync(NATIVE_CACHE_DIR, { recursive: true });
      renameSync(cachePath, ANDROID_DIR);
      console.log(`[INFO] 已从 ${cachePath} 切回 ${variant} 的原生工程`);
      return "restored";
    }
    return "fresh";
  }

  const activeVariant = detectActiveVariant();
  if (activeVariant === variant) {
    return "active";
  }
  if (activeVariant === null) {
    console.warn(`[WARN] ${ANDROID_DIR} 的原生工程不属于 dev / preview 变体，本次直接重建`);
    return "unknown";
  }

  stowAndroidDir(activeVariant);

  const cachePath = nativeCachePath(variant);
  if (existsSync(cachePath)) {
    renameSync(cachePath, ANDROID_DIR);
    console.log(`[INFO] 已从 ${cachePath} 切回 ${variant} 的原生工程`);
    return "restored";
  }
  return "fresh";
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
function tuneGradleProperties(variant) {
  upsertGradleProperty("org.gradle.jvmargs", JVM_ARGS);
  upsertGradleProperty("org.gradle.parallel", PARALLEL ? "true" : "false");
  upsertGradleProperty("org.gradle.caching", "true");
  upsertGradleProperty("org.gradle.workers.max", String(MAX_WORKERS));
  upsertGradleProperty("reactNativeArchitectures", ARCHITECTURES);
  if (variant === "preview") {
    // release 独有的 PNG 重压缩，本地预览包不需要，省一段构建时间（EAS 的生产构建不受影响）
    upsertGradleProperty("android.enablePngCrunchInReleaseBuilds", "false");
  }
}

function installDependencies() {
  // npm install 本身是增量的，依赖没变化时只有 1~2s，所以每次构建都跑一遍保证依赖最新。
  run("npm", ["install", "--no-audit", "--no-fund", "--prefer-offline"], REPO_ROOT);
}

function prepareAndroidProject(variant, env) {
  const state = activateVariant(variant);
  const clean = CLEAN_PREBUILD || state === "fresh" || state === "unknown";

  if (CLEAN_PREBUILD) {
    console.log("[INFO] BUILD_CLEAN_PREBUILD=1，重建原生工程");
  } else if (state === "active" || state === "restored") {
    console.log(`[INFO] 使用 ${variant} 的原生工程，增量同步生成文件（--no-clean，保留构建产物）`);
  } else if (state === "fresh") {
    console.log(`[INFO] 首次为 ${variant} 生成原生工程`);
  }

  const args = ["expo", "prebuild", "--platform", "android", "--no-install"];
  if (!clean) {
    args.push("--no-clean");
  }

  run("npx", args, APP_DIR, env);
}

function buildApk(variant, env) {
  tuneGradleProperties(variant);

  // RN 的 bundle 任务只会往 generated/res/react/<buildType>/ 里写本次用到的资源，不会清理上一次构建的残留。
  // assets 里的文件改名（例如 loading.png -> loading.gif）后，旧文件会和新文件一起参与资源合并，
  // 触发 "Duplicate resources" 构建失败。这份目录每次都由 Gradle 重新生成，删掉不会影响原生增量编译。
  const buildType = variant === "preview" ? "release" : "debug";
  const generatedResDir = join(ANDROID_DIR, "app", "build", "generated", "res", "react", buildType);
  if (existsSync(generatedResDir)) {
    rmSync(generatedResDir, { force: true, recursive: true });
    console.log(`[INFO] 已清理上次构建遗留的 RN 资源目录：${generatedResDir}`);
  }

  // prebuild 生成的文件在不同平台/机器上不一定带执行位，这里顺手补一下，避免 EACCES。
  try {
    chmodSync(GRADLEW, 0o755);
  } catch {
    // 权限调整失败就让 gradlew 自己去报错
  }

  const args = [
    VARIANTS[variant].gradleTask,
    `-PreactNativeArchitectures=${ARCHITECTURES}`,
    `--max-workers=${MAX_WORKERS}`,
    "--build-cache",
    "-Pkotlin.compiler.execution.strategy=in-process",
  ];
  if (!PARALLEL) {
    args.push("--no-parallel");
  }

  run(GRADLEW, args, ANDROID_DIR, env);
}

// 构建产物名带上日期和时分，避免同一天多次构建互相覆盖。
function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `${day}-${time}`;
}

function copyApk(variant) {
  const { apkSource, apkSuffix, name } = VARIANTS[variant];
  if (!existsSync(apkSource)) {
    throw new Error(`未找到构建产物: ${apkSource}`);
  }

  mkdirSync(APK_DIR, { recursive: true });
  const { version } = JSON.parse(readFileSync(join(APP_DIR, "package.json"), "utf8"));
  const apkPath = join(
    APK_DIR,
    `minibili-${version}-${apkSuffix}-${formatTimestamp(new Date())}.apk`,
  );
  copyFileSync(apkSource, apkPath);

  const size = (statSync(apkPath).size / 1024 ** 2).toFixed(1);
  console.log(`[OK] ${name}已生成: ${apkPath} (${size} MB)`);
}

function main() {
  const variant = resolveVariant();
  const { appVariant, name } = VARIANTS[variant];
  const env = buildVariantEnv(appVariant);

  console.log(
    `[INFO] 构建 ${name}（APP_VARIANT=${appVariant}）；本机 ${os.cpus().length} 线程 / ` +
      `${TOTAL_MEMORY_GIB.toFixed(1)}G 内存 => workers=${MAX_WORKERS}，并行=${PARALLEL ? "on" : "off"}，` +
      `Gradle 堆=${HEAP_MB}m，ABI=${ARCHITECTURES}`,
  );

  const totalStart = Date.now();

  if (SKIP_INSTALL) {
    console.log("[INFO] BUILD_SKIP_INSTALL=1，跳过 npm install");
  } else {
    step("安装依赖", installDependencies);
  }

  step("准备 Android 原生工程", () => prepareAndroidProject(variant, env));
  step(`编译 ${name}`, () => buildApk(variant, env));
  copyApk(variant);

  const detail = timings.map(({ cost, label }) => `${label} ${formatDuration(cost)}`).join(" / ");
  console.log(`[OK] 总耗时 ${formatDuration(Date.now() - totalStart)}（${detail}）`);
}

try {
  main();
} catch (error) {
  console.error("[ERR]", error instanceof Error ? error.message : error);
  process.exit(1);
}
