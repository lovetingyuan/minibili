import { Directory, File, Paths } from "expo-file-system";
import type { DownloadProgress, DownloadTask } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";

import { enqueueToast } from "@/features/toast";
import { formatDownloadProgress, resolveDownloadSpeed } from "@/features/video-download/format";

import {
  ensureAppUpdateNotificationPermission,
  finishAppUpdateNotification,
  showAppUpdateNotification,
} from "./notifications";
import type { AppUpdateDownloadInput, AppUpdateDownloadStartResult } from "./types";

const APP_UPDATE_DIRECTORY_NAME = "app-updates";
const APP_UPDATE_PROGRESS_INTERVAL_MS = 500;
const APK_MIME_TYPE = "application/vnd.android.package-archive";
const FLAG_GRANT_READ_URI_PERMISSION = 1;

type ActiveAppUpdateDownload = {
  task: DownloadTask | null;
};

let activeDownload: ActiveAppUpdateDownload | null = null;

function deleteQuietly(target: File | Directory) {
  try {
    target.delete();
  } catch {
    // 缓存清理失败不覆盖下载或安装结果
  }
}

function prepareDownloadDirectory() {
  const directory = new Directory(Paths.cache, APP_UPDATE_DIRECTORY_NAME);
  directory.create({ intermediates: true, idempotent: true });
  for (const entry of directory.list()) {
    deleteQuietly(entry);
  }
  return directory;
}

function buildApkFileName(releaseName: string) {
  return `${releaseName.replace(/[^a-zA-Z0-9._-]/g, "-")}.apk`;
}

async function runAppUpdateDownload(
  request: ActiveAppUpdateDownload,
  input: AppUpdateDownloadInput,
) {
  const title = `MiniBili ${input.version}`;
  let file: File | null = null;
  let bytesWritten = 0;
  let totalBytes = 0;
  let speed = 0;
  let lastEmitAt = 0;
  let lastSampleAt = Date.now();
  let lastSampleBytes = 0;
  let notifyEnabled = false;

  function publish(progress: DownloadProgress, force = false) {
    bytesWritten = progress.bytesWritten;
    if (progress.totalBytes > 0) {
      totalBytes = progress.totalBytes;
    }

    const now = Date.now();
    if (!force && now - lastEmitAt < APP_UPDATE_PROGRESS_INTERVAL_MS) {
      return;
    }
    speed = resolveDownloadSpeed({
      previousBytes: lastSampleBytes,
      previousTime: lastSampleAt,
      bytesWritten,
      time: now,
    });
    lastSampleBytes = bytesWritten;
    lastSampleAt = now;
    lastEmitAt = now;

    if (notifyEnabled) {
      void showAppUpdateNotification({
        title: `${title} 下载中`,
        body: formatDownloadProgress({ bytesWritten, totalBytes, speed }),
      });
    }
  }

  try {
    notifyEnabled = await ensureAppUpdateNotificationPermission();
    file = new File(prepareDownloadDirectory(), buildApkFileName(input.releaseName));
    const task = File.createDownloadTask(input.downloadUrl, file, { onProgress: publish });
    request.task = task;

    publish({ bytesWritten: 0, totalBytes: 0 }, true);
    enqueueToast(
      notifyEnabled ? "开始下载，可在通知栏查看进度" : "已开始下载，未开启通知权限无法显示进度",
      false,
    );

    await task.downloadAsync();
    if (!file.exists || file.size <= 0) {
      throw new Error("下载文件为空");
    }

    if (notifyEnabled) {
      await finishAppUpdateNotification({
        title: `${title} 下载完成`,
        body: "正在打开安装程序…",
      });
    }

    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: file.contentUri,
      type: APK_MIME_TYPE,
      flags: FLAG_GRANT_READ_URI_PERMISSION,
    });
  } catch {
    if (notifyEnabled) {
      await finishAppUpdateNotification({
        title: `${title} 更新失败`,
        body: "下载或打开安装程序失败，请稍后重试",
      });
    }
    enqueueToast("新版下载或安装失败，请稍后重试", false);
  } finally {
    request.task?.release();
    request.task = null;
    if (file) {
      deleteQuietly(file);
    }
    if (activeDownload === request) {
      activeDownload = null;
    }
  }
}

export function startAppUpdateDownload(
  input: AppUpdateDownloadInput,
): AppUpdateDownloadStartResult {
  if (process.env.EXPO_OS !== "android") {
    return "unsupported";
  }
  if (activeDownload) {
    enqueueToast("新版正在下载", false);
    return "busy";
  }

  const request: ActiveAppUpdateDownload = { task: null };
  activeDownload = request;
  void runAppUpdateDownload(request, input);
  return "started";
}
