#!/usr/bin/env node
// oxlint-disable no-console

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sourceMapDirectory = process.argv[2] ?? "dist";
// 用已安装的 @sentry/expo-upload-sourcemaps，避免每次上传 npx 拉取版本漂移
const cliScriptPath = require.resolve("@sentry/expo-upload-sourcemaps/cli.js");

const result = spawnSync(process.execPath, [cliScriptPath, sourceMapDirectory], {
  stdio: "inherit",
});

if (result.error) {
  console.error("[ERR] Sentry source map 上传失败：", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
