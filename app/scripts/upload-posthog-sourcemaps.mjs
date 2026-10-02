#!/usr/bin/env node
// oxlint-disable no-console

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const appConfig = require("../app.config.js");
const sourceMapDirectory = process.argv[2] ?? "dist";
const dotenvPath = path.resolve(fileURLToPath(new URL("../.env", import.meta.url)));
// 用 devDependencies 里固定的 @posthog/cli，避免每次上传都去 npx 拉 latest（版本漂移 + 网络依赖）
const cliPackagePath = require.resolve("@posthog/cli/package.json");
const cliScriptPath = path.join(path.dirname(cliPackagePath), "run-posthog-cli.js");

const result = spawnSync(
  process.execPath,
  [
    cliScriptPath,
    // 本地上传时凭据来自 .env；CI / eas env:exec 里的环境变量优先级更高
    "--dotenv-file",
    dotenvPath,
    "hermes",
    "upload",
    "--directory",
    sourceMapDirectory,
    "--release-name",
    appConfig.android.package,
    "--release-version",
    appConfig.version,
    "--build",
    String(appConfig.android.versionCode),
  ],
  { stdio: "inherit" },
);

if (result.error) {
  console.error("[ERR] PostHog source map 上传失败：", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
