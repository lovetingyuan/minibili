import { Directory, File, Paths } from "expo-file-system";
import type { DownloadProgress, DownloadTask } from "expo-file-system";

import { getVideoDownloadSource, VideoDownloadUnsupportedError } from "../../api/play-url";
import { MiniBiliAlbumName } from "../../components/image-viewer-download";
import { mediaUA } from "../../constants";
import { getStoreMethods } from "../../store";
import { showToast } from "../../utils";
import { buildVideoDownloadTitle, buildVideoFileName } from "./file-name";
import { formatDownloadProgress, resolveDownloadSpeed } from "./format";
import {
  dismissVideoDownloadNotification,
  ensureVideoDownloadNotificationPermission,
  finishVideoDownloadNotification,
  initVideoDownloadNotifications,
  showVideoDownloadNotification,
} from "./notifications";
import { ensureMediaWritePermission, saveVideoToLibrary } from "./save-video";
import type { VideoDownloadInput, VideoDownloadStartResult, VideoDownloadTask } from "./types";

/** 进度写 store 与更新通知的最小间隔，避免高频刷新 */
export const VIDEO_DOWNLOAD_PROGRESS_INTERVAL_MS = 500;

/** 下载临时目录，下载结束（保存到相册或失败）后会被清空 */
export const VIDEO_DOWNLOAD_DIRECTORY_NAME = "video-downloads";

/**
 * 视频 CDN 防盗链要求 Referer 与桌面 UA，与播放器保持一致，否则一律 403。
 */
const DownloadRequestHeaders = {
  referer: "https://www.bilibili.com",
  "user-agent": mediaUA,
};

type ActiveDownload = {
  id: string;
  /** 用户是否已经请求取消（取消可能发生在地址解析阶段） */
  cancelRequested: boolean;
  /** 当前正在运行的下载句柄，用于取消 */
  task: DownloadTask | null;
};

class DownloadCancelledError extends Error {
  constructor() {
    super("已取消下载");
    this.name = "DownloadCancelledError";
  }
}

let activeDownload: ActiveDownload | null = null;
/** 通知权限在本次运行内只申请一次 */
let notificationPermission: boolean | null = null;

function setStoreTask(task: VideoDownloadTask | null) {
  getStoreMethods().setVideoDownloadTask(task);
}

function createTaskId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function deleteQuietly(target: File | Directory) {
  try {
    target.delete();
  } catch {
    // 清理失败不影响主流程
  }
}

/**
 * 下载前重建临时目录并清掉残留：App 被系统杀死时会留下半成品文件。
 */
function prepareDownloadDirectory() {
  const directory = new Directory(Paths.cache, VIDEO_DOWNLOAD_DIRECTORY_NAME);
  directory.create({ intermediates: true, idempotent: true });
  for (const entry of directory.list()) {
    deleteQuietly(entry);
  }
  return directory;
}

async function resolveNotificationPermission() {
  if (notificationPermission === null) {
    await initVideoDownloadNotifications();
    notificationPermission = await ensureVideoDownloadNotificationPermission();
  }
  return notificationPermission;
}

/**
 * 是否正在下载（含保存到相册阶段）。
 */
export function isVideoDownloadRunning(task: VideoDownloadTask | null) {
  return task?.status === "downloading" || task?.status === "saving";
}

/**
 * 指定的分P 是否正在下载，用于播放页菜单切换成「取消下载」。
 */
export function isDownloadingVideo(task: VideoDownloadTask | null, bvid: string, cid: number) {
  return Boolean(isVideoDownloadRunning(task) && task?.bvid === bvid && task?.cid === cid);
}

/**
 * 依次尝试主地址与备用 CDN 镜像，全部失败后抛出最后一次错误。
 */
async function downloadVideoFile(
  request: ActiveDownload,
  urls: string[],
  file: File,
  onProgress: (progress: DownloadProgress) => void,
) {
  let lastError: unknown = null;

  for (const url of urls) {
    if (request.cancelRequested) {
      throw new DownloadCancelledError();
    }
    // 上一次失败可能留下半截文件，重新下载前先删掉
    deleteQuietly(file);
    const downloadTask = File.createDownloadTask(url, file, {
      headers: DownloadRequestHeaders,
      onProgress,
    });
    request.task = downloadTask;
    try {
      await downloadTask.downloadAsync();
      return;
    } catch (error) {
      if (request.cancelRequested) {
        throw new DownloadCancelledError();
      }
      lastError = error;
    } finally {
      request.task = null;
      downloadTask.release();
    }
  }

  throw lastError ?? new Error("视频下载失败");
}

async function runDownload(options: {
  request: ActiveDownload;
  task: VideoDownloadTask;
  fileName: string;
  urls: string[];
  notifyEnabled: boolean;
}) {
  const { request, task, fileName, urls, notifyEnabled } = options;
  let file: File | null = null;
  let bytesWritten = 0;
  let totalBytes = task.totalBytes;
  let lastEmitAt = 0;
  let lastSampleAt = Date.now();
  let lastSampleBytes = 0;

  const publish = (force = false) => {
    const now = Date.now();
    if (!force && now - lastEmitAt < VIDEO_DOWNLOAD_PROGRESS_INTERVAL_MS) {
      return;
    }
    task.bytesWritten = bytesWritten;
    task.totalBytes = totalBytes;
    task.speed = resolveDownloadSpeed({
      previousBytes: lastSampleBytes,
      previousTime: lastSampleAt,
      bytesWritten,
      time: now,
    });
    lastSampleBytes = bytesWritten;
    lastSampleAt = now;
    lastEmitAt = now;
    setStoreTask({ ...task });
    if (notifyEnabled) {
      void showVideoDownloadNotification({
        title: task.title,
        body: formatDownloadProgress(task),
      });
    }
  };

  try {
    file = new File(prepareDownloadDirectory(), fileName);

    if (notifyEnabled) {
      publish(true);
      showToast("开始下载，可在通知栏查看进度");
    } else {
      showToast("已开始下载，未开启通知权限无法显示进度");
    }

    await downloadVideoFile(request, urls, file, (progress) => {
      bytesWritten = progress.bytesWritten;
      if (progress.totalBytes > 0) {
        totalBytes = progress.totalBytes;
      }
      publish();
    });

    if (request.cancelRequested) {
      throw new DownloadCancelledError();
    }

    task.status = "saving";
    task.speed = 0;
    setStoreTask({ ...task });
    if (notifyEnabled) {
      void finishVideoDownloadNotification({ title: task.title, body: "正在保存到相册…" });
    }

    const saveResult = await saveVideoToLibrary(file.uri, ensureMediaWritePermission);
    if (request.cancelRequested) {
      throw new DownloadCancelledError();
    }
    if (saveResult !== "saved") {
      throw new Error(saveResult === "permission-denied" ? "相册权限被拒绝" : "保存到相册失败");
    }

    task.status = "completed";
    task.bytesWritten = totalBytes > 0 ? totalBytes : bytesWritten;
    task.speed = 0;
    setStoreTask({ ...task });
    if (notifyEnabled) {
      void finishVideoDownloadNotification({
        title: task.title,
        body: `已保存到相册 ${MiniBiliAlbumName}`,
      });
    }
    showToast(`已保存到相册 ${MiniBiliAlbumName}`);
  } catch (error) {
    task.speed = 0;
    task.bytesWritten = bytesWritten;
    if (request.cancelRequested || error instanceof DownloadCancelledError) {
      task.status = "cancelled";
      setStoreTask({ ...task });
      if (notifyEnabled) {
        void dismissVideoDownloadNotification();
      }
      showToast("已取消下载");
    } else {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : "视频下载失败";
      setStoreTask({ ...task });
      if (notifyEnabled) {
        void finishVideoDownloadNotification({
          title: task.title,
          body: "下载失败，请稍后重试",
        });
      }
      showToast("视频下载失败，请稍后重试");
    }
  } finally {
    if (file) {
      deleteQuietly(file);
    }
    request.task = null;
    if (activeDownload === request) {
      activeDownload = null;
    }
  }
}

/**
 * 开始下载当前分P。地址解析完成后立即返回 "started"，真正的下载在后台继续，
 * 进度与结果通过 store 与通知输出。
 */
export async function startVideoDownload(
  input: VideoDownloadInput,
): Promise<VideoDownloadStartResult> {
  if (activeDownload) {
    return "busy";
  }

  const request: ActiveDownload = {
    id: createTaskId(),
    cancelRequested: false,
    task: null,
  };
  activeDownload = request;

  const task: VideoDownloadTask = {
    id: request.id,
    bvid: input.bvid,
    cid: input.cid,
    page: input.page ?? 1,
    title: buildVideoDownloadTitle(input),
    quality: 0,
    totalBytes: 0,
    bytesWritten: 0,
    speed: 0,
    status: "downloading",
    startedAt: Date.now(),
  };
  // 先写入 store，播放页菜单可以立刻切换成「取消下载」
  setStoreTask({ ...task });

  let notifyEnabled = false;
  let urls: string[];
  let quality = 0;
  let size = 0;
  const fileName = buildVideoFileName(input);

  try {
    notifyEnabled = await resolveNotificationPermission();
    const source = await getVideoDownloadSource(input.bvid, input.cid);
    urls = source.urls;
    quality = source.quality;
    size = source.size;
  } catch (error) {
    activeDownload = null;
    setStoreTask(null);
    return error instanceof VideoDownloadUnsupportedError ? "unsupported" : "failed";
  }

  if (request.cancelRequested) {
    activeDownload = null;
    setStoreTask(null);
    showToast("已取消下载");
    return "started";
  }

  task.quality = quality;
  task.totalBytes = size;
  void runDownload({ request, task, fileName, urls, notifyEnabled });

  return "started";
}

/**
 * 取消当前下载任务；同时负责清理临时文件与通知。
 */
export function cancelVideoDownload() {
  const request = activeDownload;
  if (!request) {
    return;
  }
  request.cancelRequested = true;
  try {
    request.task?.cancel();
  } catch {
    // 取消失败交给后续流程兜底（下载仍在进行时会走失败分支）
  }
}
