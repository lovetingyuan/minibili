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
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERCEL_VERSION = process.env.VERCEL_CLI_VERSION ?? "59.20.0";

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = resolve(projectDir, "..", "tmp", "vercel-cli");
const cliEntry = resolve(cliDir, "node_modules", "vercel", "dist", "vc.js");

const args = process.argv.slice(2);
const isDeploy = args.includes("deploy") || args.includes("redeploy");

/** 执行子进程并返回退出码；调用方负责决定何时退出，便于 finally 里清理临时目录。 */
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  return result.status ?? 1;
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
    const status = run(
      `npm ${args.map((arg) => (arg.includes(" ") ? `"${arg}"` : arg)).join(" ")}`,
      [],
      { shell: true },
    );
    if (status !== 0) process.exit(status);
    return;
  }
  const status = run("npm", args);
  if (status !== 0) process.exit(status);
}

if (!existsSync(cliEntry)) installCli();

/**
 * Vercel Hobby 团队要求「commit 作者必须是团队 owner」，否则部署会被
 * BLOCKED（readyStateReason: commit author doesn't have permission）。
 * 本地 commit 用的是 GitHub noreply 邮箱、Vercel 账号是另一个邮箱且没连 GitHub 时就会命中。
 * 绕开方式：把源码复制到仓库外的临时目录再部署，这样部署不带 git 元数据。
 * 在 Vercel 里连上 GitHub（Account Settings → Login Connections）后可以设
 * BILI_PROXY_DEPLOY_IN_PLACE=1 恢复就地部署。
 */
function insideGitWorkTree(dir) {
  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: dir,
    encoding: "utf8",
  });
  return result.status === 0 && result.stdout.trim() === "true";
}

function shouldSkip(source) {
  const path = relative(projectDir, source).replaceAll("\\", "/");
  return (
    path !== "" &&
    (path === "node_modules" ||
      path.startsWith("node_modules/") ||
      path.startsWith(".vercel/output") ||
      path.startsWith(".vercel/node"))
  );
}

if (isDeploy && process.env.BILI_PROXY_DEPLOY_IN_PLACE !== "1" && insideGitWorkTree(projectDir)) {
  const stageDir = mkdtempSync(join(tmpdir(), "bili-proxy-deploy-"));
  console.log(`[bili-proxy] 在仓库外的临时目录部署（跳过 git 作者校验）：${stageDir}`);
  let status = 1;
  try {
    cpSync(projectDir, stageDir, { filter: (source) => !shouldSkip(source), recursive: true });
    status = run(process.execPath, [cliEntry, ...args], { cwd: stageDir });
  } finally {
    // Windows 上 CLI 刚退出时可能还占着文件，清理失败不影响部署结果。
    try {
      rmSync(stageDir, { force: true, maxRetries: 3, recursive: true, retryDelay: 200 });
    } catch {
      console.log(`[bili-proxy] 临时目录稍后可手动删除：${stageDir}`);
    }
  }
  process.exit(status);
} else {
  process.exit(run(process.execPath, [cliEntry, ...args], { cwd: projectDir }));
}
