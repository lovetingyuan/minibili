#!/usr/bin/env zx
// oxlint-disable no-console

/**
 * 生产发版脚本（仅 Windows）。
 *
 * 流程：检查环境 → 输入版本号/更新日志 → 提交并推送版本号 → EAS 生产构建
 *       → 下载 APK → 打 tag 并推送 → 打开 GitHub Release 页面
 *
 * 版本号在构建之前就落库提交，所以整个流程里工作区始终是干净的；
 * 每个阶段的进度都会写入 tmp/release-state.json，任意阶段中断后都能续跑，
 * 失败时脚本会打印可直接复制的续跑命令。
 *
 * 用法：
 *   npm run build                                        // 交互式发布
 *   npm run build -- --version 0.7.4 --changelog "A  B"  // 跳过输入
 *   npm run build -- --resume                            // 从上次中断处继续
 *   npm run build -- --resume --build-id <buildId>       // 复用指定的 EAS 构建
 *   npm run build -- --resume --apk <path>               // 复用已下载的 APK
 *   npm run build -- --reset                             // 丢弃未完成的发布记录
 */

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { parseArgs as parseNodeArgs, stripVTControlCharacters } from "node:util";

import open from "open";
import semver from "semver";
import { $, chalk, question, spinner, usePowerShell } from "zx";

// oxlint-disable-next-line react-hooks/rules-of-hooks
usePowerShell();

$.verbose = false;

/** 不抛异常的 shell：命令失败时返回 exitCode，而不是直接抛错。 */
const nothrow = $({ nothrow: true });

const APP_DIR = fileURLToPath(new URL("../", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PACKAGE_JSON_PATH = join(APP_DIR, "package.json");
const APK_DIR = join(APP_DIR, "apk");
const STATE_PATH = join(REPO_ROOT, "tmp", "release-state.json");

const MAIN_BRANCH = "main";
const REPO_URL = "https://github.com/lovetingyuan/minibili";
const BUILDS_PAGE_URL = "https://expo.dev/accounts/tingyuan/projects/minibili/builds";
const HTTP_TIMEOUT_MS = 15_000;
const APK_TIMEOUT_MS = 15 * 60_000;
const RESUME_COMMAND = "npm run build -- --resume";

process.chdir(APP_DIR);

const log = {
  info(message) {
    console.log(chalk.blue("[INFO]"), message);
  },
  success(message) {
    console.log(chalk.green("[OK]"), message);
  },
  warn(message) {
    console.log(chalk.yellow("[WARN]"), message);
  },
  error(message) {
    console.log(chalk.red("[ERR]"), message);
  },
  hint(message) {
    console.log(chalk.yellow("[HINT]"), message);
  },
};

class ReleaseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReleaseError";
  }
}

/** 当前发布记录，仅用于失败/中断时打印续跑提示。 */
let activeState = null;

// ---------------------------------------------------------------- 通用工具

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Node 的 fetch 不认 HTTP(S)_PROXY，eas-cli 认。
 * 两条网络路径不一样，报网络错误时必须把代理带上，否则根本查不出问题在哪一端。
 */
function proxyHint() {
  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;

  return proxy === undefined || proxy === "" ? null : proxy;
}

/** 取命令输出的最后一行非空内容，把 eas-cli 的整段报错压成一句话。 */
function lastOutputLine(text) {
  return (
    stripVTControlCharacters(text ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? ""
  );
}

function printUsage() {
  console.log(`
生产发版（仅 Windows）

  npm run build                                        交互式发布：依次输入版本号与更新日志
  npm run build -- --version 0.7.4 --changelog "A  B"  跳过输入
  npm run build -- --resume                            从上次中断处继续
  npm run build -- --resume --build-id <buildId>       复用指定的 EAS 构建
  npm run build -- --resume --apk <path>               复用已下载的 APK
  npm run build -- --reset                             丢弃未完成的发布记录

流程：检查环境 → 提交版本号 → EAS 生产构建 → 下载 APK → 打 tag → 打开 GitHub Release 页面
进度记录在 tmp/release-state.json，失败时脚本会打印可直接复制的续跑命令。

发布产物约定：tag v<版本>、Release 标题 minibili-<版本>、附件 minibili-<版本>.apk，
必须点 Publish release 发布为正式 release（不能存草稿、不能勾 pre-release），
否则 worker /api/releases 拉不到，App 内不会提示更新。
`);
}

function parseArgs(argv) {
  let values;
  try {
    ({ values } = parseNodeArgs({
      args: argv,
      options: {
        apk: { type: "string" },
        "build-id": { type: "string" },
        changelog: { type: "string" },
        help: { type: "boolean", short: "h", default: false },
        reset: { type: "boolean", default: false },
        resume: { type: "boolean", default: false },
        version: { type: "string" },
      },
    }));
  } catch (error) {
    const reason =
      error.code === "ERR_PARSE_ARGS_INVALID_OPTION_VALUE" ? "参数值缺失或格式错误" : "未知参数";
    throw new ReleaseError(`${reason}：${error.message}（用 --help 查看用法）`);
  }
  return {
    apkPath: values.apk === undefined ? null : resolve(values.apk.trim()),
    buildId: values["build-id"]?.trim() ?? null,
    changelog: values.changelog?.trim() ?? null,
    help: values.help,
    reset: values.reset,
    resume: values.resume,
    version: values.version?.trim() ?? null,
  };
}

function readPackageJson() {
  return JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8"));
}

function writePackageJson(data) {
  writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(data, null, 2)}\n`);
}

function getReleaseNotes(changelog) {
  return changelog
    .split("  ")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");
}

function formatSize(bytes) {
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

async function withRetry(attempts, task, label) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        log.warn(`${label} 失败（${attempt}/${attempts}），正在重试...`);
        await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1000));
      }
    }
  }

  throw lastError;
}

async function fetchWithTimeout(url, timeoutMs) {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}

async function assertReachable(url, label) {
  const proxy = proxyHint();

  await withRetry(
    3,
    async () => {
      try {
        const response = await fetchWithTimeout(url, HTTP_TIMEOUT_MS);
        if (!response.ok) {
          throw new Error(`返回 ${response.status}`);
        }
      } catch (error) {
        throw new Error(
          `${label} 无法访问：${errorMessage(error)}` +
            (proxy === null ? "" : `（已设置代理 ${proxy}，但这一步是直连不走代理）`),
        );
      }
    },
    `${label} 检查`,
  );
}

function extractJsonSegments(text, openChar, closeChar) {
  const segments = [];
  let searchPos = text.length - 1;

  while (searchPos >= 0) {
    const start = text.lastIndexOf(openChar, searchPos);
    if (start === -1) {
      break;
    }

    let depth = 0;
    let end = -1;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
      const char = text[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === openChar) {
        depth += 1;
      } else if (char === closeChar) {
        depth -= 1;
      }

      if (depth === 0) {
        end = index;
        break;
      }
    }

    if (end !== -1) {
      segments.push(text.slice(start, end + 1));
    }

    searchPos = start - 1;
  }

  return segments;
}

/** EAS 命令的输出里混着进度日志，这里把其中所有能解析的 JSON 片段都取出来。 */
function parseJsonCandidates(...texts) {
  const combined = stripVTControlCharacters(
    texts
      .filter((text) => typeof text === "string" && text.trim() !== "")
      .join("\n")
      .trim(),
  );

  if (!combined) {
    return [];
  }

  const results = [];

  for (const candidate of [
    ...extractJsonSegments(combined, "[", "]"),
    ...extractJsonSegments(combined, "{", "}"),
  ]) {
    try {
      results.push(JSON.parse(candidate));
    } catch {
      // 片段不是合法 JSON，继续尝试下一个
    }
  }

  return results;
}

/** 从任意解析结果里挑出一个 EAS 构建对象。 */
function pickBuild(parsedValues) {
  for (const value of parsedValues) {
    const list = Array.isArray(value) ? value : [value];
    for (const item of list) {
      if (item !== null && typeof item === "object" && typeof item.status === "string") {
        return item;
      }
    }
  }

  return null;
}

function buildLink(build) {
  if (build !== null && typeof build.url === "string" && build.url !== "") {
    return build.url;
  }
  if (build !== null && typeof build.id === "string" && build.id !== "") {
    return `${BUILDS_PAGE_URL}/${build.id}`;
  }
  return BUILDS_PAGE_URL;
}

// ---------------------------------------------------------------- 发布记录

function loadState() {
  if (!existsSync(STATE_PATH)) {
    return null;
  }

  let parsed;

  try {
    parsed = JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch (error) {
    throw new ReleaseError(
      `无法解析发布记录 ${STATE_PATH}：${errorMessage(error)}（可以加 --reset 丢弃它）`,
    );
  }

  if (parsed === null || typeof parsed !== "object" || typeof parsed.version !== "string") {
    throw new ReleaseError(`发布记录 ${STATE_PATH} 内容异常（可以加 --reset 丢弃它）`);
  }

  return {
    apkPath: typeof parsed.apkPath === "string" ? parsed.apkPath : null,
    buildId: typeof parsed.buildId === "string" ? parsed.buildId : null,
    buildStatus: typeof parsed.buildStatus === "string" ? parsed.buildStatus : null,
    buildUrl: typeof parsed.buildUrl === "string" ? parsed.buildUrl : null,
    bumpCommit: typeof parsed.bumpCommit === "string" ? parsed.bumpCommit : null,
    changelog: typeof parsed.changelog === "string" ? parsed.changelog : "",
    releaseOpened: parsed.releaseOpened === true,
    tagPushed: parsed.tagPushed === true,
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    version: parsed.version,
  };
}

function saveState(state) {
  state.updatedAt = new Date().toISOString();
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  activeState = state;
}

function clearState() {
  if (!existsSync(STATE_PATH)) {
    return;
  }
  rmSync(STATE_PATH, { force: true });
  log.warn(`已丢弃未完成的发布记录：${STATE_PATH}`);
}

function createState(version, changelog) {
  return {
    apkPath: null,
    buildId: null,
    buildStatus: null,
    buildUrl: null,
    bumpCommit: null,
    changelog,
    releaseOpened: false,
    tagPushed: false,
    updatedAt: null,
    version,
  };
}

function describeProgress(state) {
  if (state.tagPushed) {
    return "tag 已推送，只差打开 Release 页面";
  }
  if (state.apkPath !== null && existsSync(state.apkPath)) {
    return "APK 已就绪，接下来打 tag";
  }
  if (state.buildId !== null) {
    return state.buildStatus === "FINISHED"
      ? "EAS 构建已完成，接下来下载 APK"
      : `上次构建状态是 ${state.buildStatus ?? "未知"}，接下来重新构建`;
  }
  if (state.bumpCommit !== null) {
    return "版本号已提交，接下来 EAS 构建";
  }
  return "从写入版本号开始";
}

function printResumeInstructions(state) {
  log.hint(`发布进度记录：${STATE_PATH}`);

  if (state === null) {
    log.hint(`续跑：${RESUME_COMMAND}`);
    return;
  }

  if (state.tagPushed) {
    log.hint(`tag 已推送，续跑只会重新打开 Release 页面：${RESUME_COMMAND}`);
  } else if (state.apkPath !== null && existsSync(state.apkPath)) {
    log.hint(`APK 已就绪（${state.apkPath}），续跑会继续打 tag：${RESUME_COMMAND}`);
  } else if (state.buildId !== null) {
    if (state.buildStatus === "FINISHED") {
      log.hint(`构建已完成（buildId=${state.buildId}），续跑只会重新下载 APK：${RESUME_COMMAND}`);
      log.hint(`也可以手动下载后指定文件：${RESUME_COMMAND} --apk <path>`);
    } else {
      log.hint(
        `上次构建状态是 ${state.buildStatus ?? "未知"}（buildId=${state.buildId}），续跑会重新构建：${RESUME_COMMAND}`,
      );
      log.hint(`如果那次构建其实成功了：${RESUME_COMMAND} --build-id <buildId>`);
    }
  } else if (state.bumpCommit !== null) {
    log.hint(`版本号已提交推送，续跑会重新发起构建：${RESUME_COMMAND}`);
    log.hint(`如果构建其实已经成功：${RESUME_COMMAND} --build-id <buildId>`);
  } else {
    log.hint(`续跑：${RESUME_COMMAND}`);
    log.hint(`如果已经发起过构建：${RESUME_COMMAND} --build-id <buildId>`);
  }

  log.hint(`EAS 构建列表：${BUILDS_PAGE_URL}`);
}

// ---------------------------------------------------------------- 各阶段

/**
 * eas-cli 走系统代理，它才是发版真正用的网络路径。
 * 探活和 --version 都验证不了这条路径，必须真的打一次接口（whoami）。
 */
async function checkEasLogin() {
  const result = await nothrow`npx --yes eas-cli@latest whoami`;

  if (result.exitCode !== 0) {
    const proxy = proxyHint();
    const reason = lastOutputLine(result.stderr) || lastOutputLine(result.stdout) || "无输出";

    throw new ReleaseError(
      `EAS 接口请求失败：${reason}` +
        (proxy === null
          ? ""
          : `（eas-cli 走代理 ${proxy}，先确认代理可用，或临时清掉 HTTP(S)_PROXY 再试）`),
    );
  }

  return result.stdout.trim();
}

async function checkEnvironment() {
  await spinner("检查环境...", async () => {
    const gitStatus = await $`git status --porcelain`;
    const dirtyPaths = gitStatus.stdout
      .split(/\r?\n/)
      // porcelain v1 每行是 "XY PATH"，路径始终相对仓库根目录
      .filter((line) => line.trim() !== "")
      .map((line) => line.slice(3).trim())
      .filter(Boolean);
    const unexpected = dirtyPaths.filter((path) => path !== "app/package.json");

    if (unexpected.length > 0) {
      throw new ReleaseError(
        `Git 工作区不干净，请先提交或撤销这些改动：\n${unexpected.join("\n")}`,
      );
    }

    if (dirtyPaths.length > 0) {
      log.warn("检测到 app/package.json 有未提交改动，将按上次中断的发布继续处理");
    }

    const branch = await $`git rev-parse --abbrev-ref HEAD`;
    if (branch.stdout.trim() !== MAIN_BRANCH) {
      throw new ReleaseError(`当前分支是 ${branch.stdout.trim()}，请切到 ${MAIN_BRANCH} 再发版`);
    }

    await $`git fetch origin`;
    const summary = await $`git status --short --branch`;
    const branchSummary = summary.stdout.split("\n")[0]?.trim() ?? "";

    if (!branchSummary.includes("...")) {
      throw new ReleaseError("当前分支没有跟踪远端分支，无法发版");
    }

    if (branchSummary.includes("behind")) {
      throw new ReleaseError(`当前分支落后于 origin/${MAIN_BRANCH}，请先 git pull`);
    }

    await assertReachable("https://github.com", "GitHub");
    await assertReachable("https://api.expo.dev", "Expo API");

    await withRetry(2, () => $`npx --yes eas-cli@latest --version`, "EAS CLI");
    const easUser = await withRetry(3, checkEasLogin, "EAS 接口");

    if (easUser === "") {
      throw new ReleaseError("EAS CLI 未登录，请先执行 npx eas-cli@latest login");
    }
  });

  log.success("环境检查通过");
}

async function resolveReleaseInfo(currentVersion, options) {
  const newVersion = options.version ?? (await question(`版本号（${currentVersion} -> ?）`)).trim();

  if (!semver.valid(newVersion) || !semver.gt(newVersion, currentVersion)) {
    throw new ReleaseError(`版本号必须是大于当前版本 ${currentVersion} 的合法 semver`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    throw new ReleaseError("版本号必须是 x.y.z 三段纯数字，否则 Release 名称不会被 App 识别");
  }

  const changelog = options.changelog ?? (await question("更新日志（双空格分隔）")).trim();

  if (changelog === "") {
    throw new ReleaseError("更新日志不能为空");
  }

  return { changelog, newVersion };
}

function assertVersionCode(pkg) {
  const versionCode = pkg.config?.versionCode;

  if (typeof versionCode !== "number" || !Number.isInteger(versionCode) || versionCode <= 0) {
    throw new ReleaseError("app/package.json 的 config.versionCode 缺失或不是正整数");
  }

  return versionCode;
}

async function assertVersionAvailable(version) {
  const tagName = `v${version}`;
  const existing = await nothrow`git tag --list ${tagName}`;

  if (existing.stdout.trim() !== "") {
    throw new ReleaseError(
      `tag ${tagName} 已存在，请换一个版本号；如果上次发布没跑完，请用 ${RESUME_COMMAND}`,
    );
  }
}

async function packageVersionAtCommit(commit) {
  const result = await nothrow`git show ${commit}:app/package.json`;

  if (result.exitCode !== 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout);
    return typeof parsed.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

async function ensureCommitPushed(commit) {
  const pushed = await nothrow`git merge-base --is-ancestor ${commit} origin/main`;

  if (pushed.exitCode === 0) {
    return;
  }

  await withRetry(3, () => $`git push origin ${MAIN_BRANCH}`, "git push");
}

async function isPackageJsonDirty() {
  const result = await $`git status --porcelain -- package.json`;
  return result.stdout.trim() !== "";
}

async function ensureVersionCommitted(state) {
  if (state.bumpCommit !== null) {
    const committedVersion = await packageVersionAtCommit(state.bumpCommit);

    if (committedVersion === state.version) {
      await ensureCommitPushed(state.bumpCommit);
      log.success(`版本号已在提交 ${state.bumpCommit} 中，跳过写入`);
      return state.bumpCommit;
    }

    log.warn(`提交 ${state.bumpCommit} 里找不到版本 ${state.version}，将重新写入`);
    state.bumpCommit = null;
  }

  // 发布记录丢失但 HEAD 已经是目标版本时，直接复用 HEAD，避免 git commit 因无改动而失败
  if ((await packageVersionAtCommit("HEAD")) === state.version && !(await isPackageJsonDirty())) {
    state.bumpCommit = (await $`git rev-parse --short HEAD`).stdout.trim();
    saveState(state);
    await ensureCommitPushed(state.bumpCommit);
    log.success(`HEAD（${state.bumpCommit}）已经是 ${state.version}，跳过写入与提交`);
    return state.bumpCommit;
  }

  await spinner("写入并提交版本号...", async () => {
    const pkg = readPackageJson();
    const previousVersionCode = assertVersionCode(pkg);

    if (pkg.version === state.version) {
      log.info(`app/package.json 已经是 ${state.version}，沿用 versionCode ${previousVersionCode}`);
    } else {
      const shortHead = (await $`git rev-parse --short HEAD`).stdout.trim();

      pkg.version = state.version;
      pkg.gitHead = shortHead;
      pkg.config = { ...pkg.config, versionCode: previousVersionCode + 1 };
      writePackageJson(pkg);

      log.success(
        `app/package.json 更新为 ${state.version}（versionCode ${previousVersionCode} -> ${previousVersionCode + 1}）`,
      );
    }

    const commitMessage = `chore(release): v${state.version}`;

    await $`git add package.json`;
    await $`git commit -m ${commitMessage}`;
    state.bumpCommit = (await $`git rev-parse --short HEAD`).stdout.trim();
    saveState(state);

    await ensureCommitPushed(state.bumpCommit);
    log.success(`已提交并推送：${commitMessage}（${state.bumpCommit}）`);
  });

  return state.bumpCommit;
}

async function fetchBuildDetails(buildId) {
  const result =
    await nothrow`npx --yes eas-cli@latest build:view ${buildId} --json --non-interactive`;

  if (result.exitCode !== 0) {
    return null;
  }

  return pickBuild(parseJsonCandidates(result.stdout, result.stderr));
}

async function findFinishedBuild(version) {
  const result =
    await nothrow`npx --yes eas-cli@latest build:list --platform android --limit 10 --json --non-interactive`;

  if (result.exitCode !== 0) {
    return null;
  }

  for (const value of parseJsonCandidates(result.stdout, result.stderr)) {
    if (!Array.isArray(value)) {
      continue;
    }

    const match = value.find(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        item.status === "FINISHED" &&
        String(item.appVersion ?? "") === version,
    );

    if (match !== undefined) {
      return match;
    }
  }

  return null;
}

async function runEasBuild(state) {
  log.info("开始 EAS 生产构建，这一步通常要十几分钟");

  let build = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await spinner(
      "EAS 构建中...",
      () =>
        nothrow`npx --yes eas-cli@latest build --platform android --profile production --message ${state.changelog} --json --non-interactive --wait`,
    );

    build = pickBuild(parseJsonCandidates(result.stdout, result.stderr));
    if (build !== null) {
      break;
    }

    const output = stripVTControlCharacters(`${result.stdout}\n${result.stderr}`);
    const uploadErrorIndex = output.indexOf("Failed to upload the project tarball to EAS Build");
    const uploadFailed = uploadErrorIndex !== -1;
    const failureOutput = uploadFailed ? output.slice(uploadErrorIndex) : output;
    const networkError = failureOutput.match(
      /\b(?:ECONNRESET|ETIMEDOUT|ESOCKETTIMEDOUT|ECONNREFUSED|EPIPE|ENOTFOUND|EAI_AGAIN)\b|socket hang up/i,
    )?.[0];

    // 源码包上传失败时尚未创建云端构建，只有这个阶段可以安全重试。
    if (result.exitCode !== 0 && uploadFailed) {
      if (networkError !== undefined && attempt < 3) {
        log.warn(`源码包上传失败（${networkError}，${attempt}/3），正在重试...`);
        await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 2000));
        continue;
      }

      const proxy = proxyHint();
      const reason =
        networkError ?? failureOutput.match(/^Reason:\s*(.+)$/m)?.[1]?.trim() ?? "详情见 EAS 输出";
      throw new ReleaseError(
        `源码包上传失败：${reason}，尚未创建云端构建。\n` +
          (proxy === null
            ? "请配置能访问 storage.googleapis.com 的 HTTPS_PROXY 后重试。\n"
            : `当前代理：${proxy}，请确认代理节点能稳定上传到 storage.googleapis.com，必要时更换节点。\n`) +
          `续跑：${RESUME_COMMAND}`,
      );
    }

    if (result.exitCode !== 0) {
      throw new ReleaseError(
        `EAS 构建命令失败：${networkError ?? (lastOutputLine(result.stderr) || lastOutputLine(result.stdout) || "无输出")}\n` +
          `请先在构建列表确认状态，已有构建可指定：\n  ${RESUME_COMMAND} --build-id <buildId>\n  ${BUILDS_PAGE_URL}`,
      );
    }

    throw new ReleaseError(
      "无法从 EAS 输出里解析出构建结果，请打开构建列表确认状态后手动指定：\n" +
        `  ${RESUME_COMMAND} --build-id <buildId>\n  ${BUILDS_PAGE_URL}`,
    );
  }

  if (typeof build.id === "string" && build.id !== "") {
    state.buildId = build.id;
    state.buildStatus = build.status;
    state.buildUrl = buildLink(build);
    saveState(state);
  }

  if (build.status !== "FINISHED") {
    throw new ReleaseError(`EAS 构建未成功，状态是 ${build.status}，日志见 ${buildLink(build)}`);
  }

  if (typeof build.appVersion === "string" && build.appVersion !== state.version) {
    // 版本对不上的构建对本次发布没有意义，清掉记录，续跑会重新构建
    state.buildId = null;
    state.buildStatus = null;
    state.buildUrl = null;
    saveState(state);
    throw new ReleaseError(
      `构建出来的版本是 ${build.appVersion}，与目标版本 ${state.version} 不一致，请检查 app/package.json`,
    );
  }

  log.success(`EAS 构建完成：${buildLink(build)}`);
  return build;
}

async function ensureBuild(state) {
  if (state.buildId !== null) {
    const existing = await fetchBuildDetails(state.buildId);

    if (existing !== null && existing.status === "FINISHED") {
      log.success(`复用已完成的构建 ${state.buildId}`);
      state.buildStatus = existing.status;
      state.buildUrl = buildLink(existing);
      saveState(state);
      return existing;
    }

    log.warn(
      `已记录的构建 ${state.buildId} 状态是 ${existing?.status ?? "未知"}，将重新查找或构建`,
    );
    state.buildId = null;
    state.buildStatus = null;
    saveState(state);
  }

  const reused = await findFinishedBuild(state.version);

  if (reused !== null) {
    state.buildId = typeof reused.id === "string" ? reused.id : null;
    state.buildStatus = reused.status;
    state.buildUrl = buildLink(reused);
    saveState(state);
    log.success(`找到 ${state.version} 已完成的构建，复用它而不重新构建：${state.buildUrl}`);
    return reused;
  }

  return runEasBuild(state);
}

async function downloadApk(state, build) {
  const apkUrl = build?.artifacts?.buildUrl;

  if (typeof apkUrl !== "string" || apkUrl === "") {
    throw new ReleaseError("EAS 构建结果里没有 artifacts.buildUrl，无法下载 APK");
  }

  const apkPath = join(APK_DIR, `minibili-${state.version}.apk`);
  const tempPath = `${apkPath}.part`;

  mkdirSync(APK_DIR, { recursive: true });
  rmSync(tempPath, { force: true });

  log.info(`从 ${apkUrl} 下载 APK`);

  await spinner("下载 APK...", async () => {
    await withRetry(
      3,
      async () => {
        // 每次重试都清掉半截文件，成功后先写 .part 再改名，避免留下看起来完整的残缺文件
        rmSync(tempPath, { force: true });

        const response = await fetchWithTimeout(apkUrl, APK_TIMEOUT_MS);
        if (!response.ok || !response.body) {
          throw new Error(`下载失败：HTTP ${response.status}`);
        }

        await pipeline(Readable.fromWeb(response.body), createWriteStream(tempPath));
      },
      "APK 下载",
    );

    rmSync(apkPath, { force: true });
    renameSync(tempPath, apkPath);
  });

  state.apkPath = apkPath;
  saveState(state);
  log.success(`APK 已保存：${apkPath}（${formatSize(statSync(apkPath).size)}）`);
  return apkPath;
}

async function ensureApkReady(state, build) {
  if (state.apkPath !== null && existsSync(state.apkPath)) {
    log.success(`复用已下载的 APK：${state.apkPath}`);
    return state.apkPath;
  }

  if (state.apkPath !== null) {
    log.warn(`发布记录里的 APK 不存在：${state.apkPath}，将重新下载`);
    state.apkPath = null;
  }

  return downloadApk(state, build);
}

async function ensureTagPushed(state) {
  const tagName = `v${state.version}`;

  if (state.tagPushed) {
    log.success(`tag ${tagName} 已推送`);
    return tagName;
  }

  await spinner("打 tag 并推送...", async () => {
    const existing = await nothrow`git tag --list ${tagName}`;

    if (existing.stdout.trim() === "") {
      // 固定打在发布提交上，避免中途有别的提交时 tag 指错地方
      await $`git tag -a ${tagName} -m ${state.changelog} ${state.bumpCommit}`;
    } else {
      const target = (await $`git rev-list -n 1 ${tagName}`).stdout.trim();

      if (state.bumpCommit !== null && target !== state.bumpCommit) {
        throw new ReleaseError(
          `tag ${tagName} 已存在且指向 ${target}，与本次发布提交 ${state.bumpCommit} 不一致，` +
            "请确认后删除该 tag 或换一个版本号",
        );
      }

      log.warn(`tag ${tagName} 已存在，直接复用它`);
    }

    await withRetry(3, () => $`git push origin ${tagName}`, "git push tag");
  });

  state.tagPushed = true;
  saveState(state);
  log.success(`tag 已推送：${tagName}`);
  return tagName;
}

async function openGitHubRelease(state, apkPath) {
  const releaseUrl = new URL(`${REPO_URL}/releases/new`);
  releaseUrl.searchParams.set("tag", `v${state.version}`);
  releaseUrl.searchParams.set("title", `minibili-${state.version}`);
  releaseUrl.searchParams.set("body", getReleaseNotes(state.changelog));

  await open(releaseUrl.toString());

  state.releaseOpened = true;
  saveState(state);

  log.success("已打开 GitHub Release 页面");
  log.info(`请上传附件：${apkPath}`);
  log.warn("附件名不能改，必须是 minibili-<版本>.apk，改了 App 内更新会 404");
  log.warn("必须点 Publish release 发布为正式 release（不能存草稿、不能勾 pre-release）");
}

// ---------------------------------------------------------------- 入口

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  if (options.reset) {
    clearState();
  }

  let recorded = loadState();

  if (options.resume && recorded === null) {
    throw new ReleaseError(`没有找到可续跑的发布记录（${STATE_PATH}）`);
  }

  // 上一次已经跑完（tag 都推了）的记录不拦着发新版本，直接丢弃
  if (!options.resume && recorded !== null && recorded.tagPushed) {
    log.info(`上次发布 v${recorded.version} 已完成，忽略它的发布记录`);
    clearState();
    recorded = null;
  }

  await checkEnvironment();

  let state;

  if (options.resume) {
    state = recorded;

    if (options.version !== null && options.version !== state.version) {
      throw new ReleaseError(
        `--version ${options.version} 与发布记录里的 ${state.version} 不一致，` +
          "如需放弃请先执行 npm run build -- --reset",
      );
    }
    if (options.changelog !== null && options.changelog !== state.changelog) {
      throw new ReleaseError(
        "--changelog 与发布记录里的更新日志不一致，如需放弃请先执行 npm run build -- --reset",
      );
    }

    log.info(`续跑发布 v${state.version}：${describeProgress(state)}`);
  } else {
    const pkg = readPackageJson();

    if (typeof pkg.version !== "string" || pkg.version === "") {
      throw new ReleaseError("app/package.json 缺少 version");
    }

    log.info(`当前版本：${pkg.version}`);

    const { changelog, newVersion } = await resolveReleaseInfo(pkg.version, options);

    assertVersionCode(pkg);

    if (recorded !== null && recorded.version !== newVersion) {
      throw new ReleaseError(
        `存在未完成的发布 v${recorded.version}（${describeProgress(recorded)}），` +
          `请先用 ${RESUME_COMMAND} 续跑，或 npm run build -- --reset 丢弃`,
      );
    }

    await assertVersionAvailable(newVersion);

    state =
      recorded !== null && recorded.version === newVersion
        ? { ...recorded, changelog }
        : createState(newVersion, changelog);
    saveState(state);
  }

  if (options.buildId !== null) {
    state.buildId = options.buildId;
    state.buildStatus = null;
    state.buildUrl = null;
    saveState(state);
    log.info(`使用指定的构建：${options.buildId}`);
  }

  if (options.apkPath !== null) {
    if (!existsSync(options.apkPath)) {
      throw new ReleaseError(`--apk 指定的文件不存在：${options.apkPath}`);
    }
    state.apkPath = options.apkPath;
    saveState(state);
    log.info(`使用指定的 APK：${options.apkPath}`);
  }

  activeState = state;

  await ensureVersionCommitted(state);
  const build = await ensureBuild(state);
  const apkPath = await ensureApkReady(state, build);
  await ensureTagPushed(state);
  await openGitHubRelease(state, apkPath);

  log.success(`发布流程完成：v${state.version}`);
}

process.on("SIGINT", () => {
  log.warn("已中断");
  if (activeState !== null) {
    printResumeInstructions(activeState);
  }
  process.exit(130);
});

try {
  await main();
} catch (error) {
  log.error(errorMessage(error));
  if (activeState !== null) {
    printResumeInstructions(activeState);
  }
  process.exit(1);
}
