#!/usr/bin/env node
// oxlint-disable no-console

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const appConfig = require("../app.config.js");
const sourceMapDirectory = process.argv[2] ?? "dist";
const useShell = process.platform === "win32";

const result = spawnSync(
  "npx",
  [
    "--yes",
    "@posthog/cli@latest",
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
  { shell: useShell, stdio: "inherit" },
);

if (result.error) {
  console.error("[ERR] PostHog source map 上传失败：", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
