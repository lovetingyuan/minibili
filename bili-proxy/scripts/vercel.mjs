#!/usr/bin/env node
/**
 * Vercel CLI 启动器（`npm run vercel -- <args>`）。
 *
 * 为什么不用 npx：npm 11.6.2 在 workspace 子目录里执行 npx 时，会把
 * node_modules/.package-lock.json 中 workspace 软链的空 version 交给 semver 比较，
 * 安装 vercel（依赖 stream-to-promise → end-of-stream）时直接崩溃：
 * `npm error Invalid Version:`。
 *
 * 这里改为把 CLI 装到仓库根的 tmp/ 目录（已 gitignore），再用 node 直接执行它的入口，
 * 完全不经过 npx 的依赖解析，也不会污染根 package.json 与 lockfile。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERCEL_VERSION = process.env.VERCEL_CLI_VERSION ?? "59.20.0";

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = resolve(projectDir, "..", "tmp", "vercel-cli");
const cliEntry = resolve(cliDir, "node_modules", "vercel", "dist", "vc.js");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function installCli() {
  console.log(`[bili-proxy] 安装 Vercel CLI ${VERCEL_VERSION} 到 ${cliDir}`);
  // 必须用 --prefix 把这个目录当成独立项目：否则 npm 会向上找到仓库根的
  // package.json，把 CLI 装进 monorepo 依赖树。
  mkdirSync(cliDir, { recursive: true });
  const args = [
    "install",
    "--prefix",
    cliDir,
    "--no-save",
    "--no-package-lock",
    "--no-audit",
    "--no-fund",
    `vercel@${VERCEL_VERSION}`,
  ];
  if (process.platform === "win32") {
    // Windows 上 cmd 才能直接跑 npm；这里自己拼命令串并给参数加引号，
    // 既兼容带空格的路径，也避开 Node 对「args + shell」组合的废弃警告。
    run(`npm ${args.map((arg) => (arg.includes(" ") ? `"${arg}"` : arg)).join(" ")}`, [], {
      shell: true,
    });
    return;
  }
  run("npm", args);
}

if (!existsSync(cliEntry)) installCli();
run(process.execPath, [cliEntry, ...process.argv.slice(2)], { cwd: projectDir });
