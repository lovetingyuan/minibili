#!/usr/bin/env zx

import { createWriteStream, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import open from "open";
import semver from "semver";
import { $, chalk, question, spinner, usePowerShell } from "zx";

// oxlint-disable-next-line react-hooks/rules-of-hooks
usePowerShell();

$.verbose = false;

const APP_DIR = fileURLToPath(new URL("../", import.meta.url));
const PACKAGE_JSON_PATH = fileURLToPath(new URL("../package.json", import.meta.url));
const APK_DIR = fileURLToPath(new URL("../apk", import.meta.url));
const MAIN_BRANCH = "main";
const REPO_URL = "https://github.com/lovetingyuan/minibili";

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
};

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

async function withRetry(attempts, task, label) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        log.warn(`${label} failed (${attempt}/${attempts}), retrying...`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw lastError;
}

async function assertReachable(url, label) {
  await withRetry(
    3,
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${label} responded with ${response.status}`);
      }
    },
    `${label} check`,
  );
}

function extractJsonSegment(text, openChar, closeChar) {
  let searchPos = text.length - 1;

  while (searchPos >= 0) {
    const start = text.lastIndexOf(openChar, searchPos);
    if (start === -1) {
      return null;
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
        } else if (char === "\"") {
          inString = false;
        }
        continue;
      }

      if (char === "\"") {
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
      return text.slice(start, end + 1);
    }

    searchPos = start - 1;
  }

  return null;
}

function parseBuildResult(stdout, stderr) {
  const combined = `${stdout ?? ""}\n${stderr ?? ""}`.trim();
  if (!combined) {
    throw new Error("EAS build output is empty");
  }

  const candidates = [
    extractJsonSegment(combined, "[", "]"),
    extractJsonSegment(combined, "{", "}"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const build = Array.isArray(parsed) ? parsed[0] : parsed;
      if (build && typeof build === "object" && typeof build.status === "string") {
        return build;
      }
    } catch {
      continue;
    }
  }

  throw new Error("Unable to parse EAS build JSON output");
}

async function checkEnvironment() {
  await spinner("Checking environment...", async () => {
    const gitStatus = await $`git status --porcelain`;
    if (gitStatus.stdout.trim() !== "") {
      throw new Error("Git workspace is not clean");
    }

    const branch = await $`git rev-parse --abbrev-ref HEAD`;
    if (branch.stdout.trim() !== MAIN_BRANCH) {
      throw new Error(`Current branch is ${branch.stdout.trim()}, expected ${MAIN_BRANCH}`);
    }

    await $`git fetch origin`;
    const summary = await $`git status --short --branch`;
    const branchSummary = summary.stdout.split("\n")[0]?.trim() ?? "";

    if (!branchSummary.includes("...")) {
      throw new Error("Current branch does not track a remote branch");
    }

    if (branchSummary.includes("behind")) {
      throw new Error("Current branch is behind origin/main, please pull first");
    }

    await assertReachable("https://github.com", "GitHub");
    await assertReachable("https://api.expo.dev", "Expo API");

    await withRetry(2, () => $`npx --yes eas-cli@latest --version`, "EAS CLI version");
    const easUser = await withRetry(2, () => $`npx --yes eas-cli@latest whoami`, "EAS login");
    if (!easUser.stdout.trim()) {
      throw new Error("EAS CLI is not logged in");
    }
  });

  log.success("Environment check passed");
}

async function promptReleaseInfo(currentVersion) {
  const newVersion = (await question(`版本号（${currentVersion} -> ?）`)).trim();
  if (!semver.valid(newVersion) || !semver.gt(newVersion, currentVersion)) {
    throw new Error("版本号必须是大于当前版本的合法 semver");
  }

  const changelog = (await question("更新日志（双空格分隔）")).trim();
  if (!changelog) {
    throw new Error("更新日志不能为空");
  }

  return {
    changelog,
    newVersion,
  };
}

async function updatePackageJson(newVersion, changelog) {
  const originalText = readFileSync(PACKAGE_JSON_PATH, "utf8");
  const pkg = JSON.parse(originalText);
  const commitHash = (await $`git rev-parse --short HEAD`).stdout.trim();

  pkg.version = newVersion;
  pkg.gitHead = commitHash;
  pkg.config = {
    ...pkg.config,
    changelog,
    versionCode: Number(pkg.config?.versionCode ?? 0) + 1,
  };

  writePackageJson(pkg);

  return {
    originalText,
    packageJson: pkg,
  };
}

async function restorePackageJson(originalText) {
  writeFileSync(PACKAGE_JSON_PATH, originalText);
  log.warn("Restored app/package.json");
}

async function runEasBuild(newVersion, changelog) {
  log.info("Starting EAS Android production build");

  const result = await spinner("Running EAS build...", async () => {
    return $`npx --yes eas-cli@latest build --platform android --profile production --message ${changelog} --json --non-interactive --wait`;
  });

  const build = parseBuildResult(result.stdout, result.stderr);

  if (build.status !== "FINISHED") {
    throw new Error(`Unexpected EAS build status: ${build.status}`);
  }

  if (build.appVersion && build.appVersion !== newVersion) {
    throw new Error(`Built version ${build.appVersion} does not match ${newVersion}`);
  }

  if (build.platform && build.platform !== "ANDROID") {
    throw new Error(`Unexpected build platform: ${build.platform}`);
  }

  log.success("EAS build finished");
  return build;
}

async function downloadApk(newVersion, build) {
  const apkUrl = build?.artifacts?.buildUrl;
  if (!apkUrl) {
    throw new Error("EAS build result does not contain artifacts.buildUrl");
  }

  const apkPath = `${APK_DIR}\\minibili-${newVersion}.apk`;
  log.info(`Downloading APK from ${apkUrl}`);

  await spinner("Downloading APK...", async () => {
    rmSync(APK_DIR, { force: true, recursive: true });
    mkdirSync(APK_DIR, { recursive: true });

    const response = await withRetry(
      3,
      async () => {
        const res = await fetch(apkUrl);
        if (!res.ok || !res.body) {
          throw new Error(`Download failed with status ${res.status}`);
        }
        return res;
      },
      "APK download",
    );

    await pipeline(Readable.fromWeb(response.body), createWriteStream(apkPath));
  });

  log.success(`APK saved to ${apkPath}`);
  return apkPath;
}

async function commitAndPushRelease(newVersion, onCommitted) {
  const commitMessage = `chore(release): v${newVersion}`;

  await spinner("Committing release changes...", async () => {
    await $`git add package.json`;
    await $`git commit -m ${commitMessage}`;
  });
  onCommitted();

  await spinner("Pushing release commit...", async () => {
    await withRetry(3, () => $`git push origin ${MAIN_BRANCH}`, "git push");
  });

  log.success(`Release commit pushed: ${commitMessage}`);
  return commitMessage;
}

async function createAndPushTag(newVersion, changelog) {
  const tagName = `v${newVersion}`;

  await spinner("Creating release tag...", async () => {
    await $`git tag -a ${tagName} -m ${changelog}`;
  });

  await spinner("Pushing release tag...", async () => {
    await withRetry(3, () => $`git push origin ${tagName}`, "git push tag");
  });

  log.success(`Release tag pushed: ${tagName}`);
  return tagName;
}

async function openGitHubRelease(newVersion, changelog) {
  const releaseUrl = new URL(`${REPO_URL}/releases/new`);
  releaseUrl.searchParams.set("tag", `v${newVersion}`);
  releaseUrl.searchParams.set("title", `minibili-${newVersion}`);
  releaseUrl.searchParams.set("body", getReleaseNotes(changelog));

  await open(releaseUrl.toString());
  log.success("Opened GitHub release page");
}

async function main() {
  let originalPackageText = null;
  let releaseCommitted = false;

  try {
    await checkEnvironment();

    const currentPackage = readPackageJson();
    const currentVersion = currentPackage.version;
    if (!currentVersion) {
      throw new Error("app/package.json is missing version");
    }

    log.info(`Current version: ${currentVersion}`);

    const { newVersion, changelog } = await promptReleaseInfo(currentVersion);
    const updated = await updatePackageJson(newVersion, changelog);
    originalPackageText = updated.originalText;
    log.success(`Updated app/package.json to ${newVersion}`);

    const build = await runEasBuild(newVersion, changelog);
    await downloadApk(newVersion, build);

    await commitAndPushRelease(newVersion, () => {
      releaseCommitted = true;
    });

    await createAndPushTag(newVersion, changelog);
    await openGitHubRelease(newVersion, changelog);

    log.success("Release flow completed");
  } catch (error) {
    if (originalPackageText !== null && !releaseCommitted) {
      await restorePackageJson(originalPackageText);
    }

    log.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

await main();
