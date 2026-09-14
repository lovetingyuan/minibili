import type { DownloadProgress } from "expo-file-system";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { VideoDownloadTask } from "./types";

const mocks = vi.hoisted(() => {
  const state: { current: VideoDownloadTask | null; writes: (VideoDownloadTask | null)[] } = {
    current: null,
    writes: [],
  };

  return {
    VideoDownloadUnsupportedError: class VideoDownloadUnsupportedError extends Error {},
    createDownloadTask: vi.fn(),
    deleteTarget: vi.fn(),
    directoryCreate: vi.fn(),
    directoryList: vi.fn(),
    getVideoDownloadSource: vi.fn(),
    saveVideoToLibrary: vi.fn(),
    ensureMediaWritePermission: vi.fn(),
    initVideoDownloadNotifications: vi.fn(),
    ensureVideoDownloadNotificationPermission: vi.fn(),
    showVideoDownloadNotification: vi.fn(),
    finishVideoDownloadNotification: vi.fn(),
    dismissVideoDownloadNotification: vi.fn(),
    showToast: vi.fn(),
    state,
    setVideoDownloadTask: (task: VideoDownloadTask | null) => {
      state.current = task;
      state.writes.push(task);
    },
  };
});

vi.mock("expo-file-system", () => {
  function joinParts(parts: (string | { uri: string })[]) {
    return parts
      .map((part) => (typeof part === "string" ? part : part.uri))
      .join("/")
      .replace(/\/{2,}/g, "/");
  }

  class MockFile {
    uri: string;

    constructor(...parts: (string | { uri: string })[]) {
      this.uri = joinParts(parts);
    }

    static createDownloadTask = mocks.createDownloadTask;
    delete = mocks.deleteTarget;
  }

  class MockDirectory {
    uri: string;

    constructor(...parts: (string | { uri: string })[]) {
      this.uri = joinParts(parts);
    }

    create = mocks.directoryCreate;
    list = mocks.directoryList;
    delete = mocks.deleteTarget;
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { cache: { uri: "/cache" } },
  };
});

vi.mock("../../api/play-url", () => ({
  getVideoDownloadSource: mocks.getVideoDownloadSource,
  VideoDownloadUnsupportedError: mocks.VideoDownloadUnsupportedError,
}));

vi.mock("../../store", () => ({
  getStoreMethods: () => ({
    getVideoDownloadTask: () => mocks.state.current,
    setVideoDownloadTask: mocks.setVideoDownloadTask,
  }),
}));

vi.mock("../../utils", () => ({ showToast: mocks.showToast }));

vi.mock("./notifications", () => ({
  initVideoDownloadNotifications: mocks.initVideoDownloadNotifications,
  ensureVideoDownloadNotificationPermission: mocks.ensureVideoDownloadNotificationPermission,
  showVideoDownloadNotification: mocks.showVideoDownloadNotification,
  finishVideoDownloadNotification: mocks.finishVideoDownloadNotification,
  dismissVideoDownloadNotification: mocks.dismissVideoDownloadNotification,
}));

vi.mock("./save-video", () => ({
  ensureMediaWritePermission: mocks.ensureMediaWritePermission,
  saveVideoToLibrary: mocks.saveVideoToLibrary,
}));

type Controller = typeof import("./controller");

type FakeDownloadTask = {
  downloadAsync: () => Promise<unknown>;
  cancel: () => void;
  release: () => void;
};

const downloadInput = { bvid: "BV1test", cid: 123, title: "测试视频" };

let controller: Controller;

function installDownloadTask(
  handler: (
    url: string,
    options: { onProgress?: (progress: DownloadProgress) => void },
  ) => FakeDownloadTask,
) {
  mocks.createDownloadTask.mockImplementation(
    (
      url: string,
      _file: unknown,
      options: { onProgress?: (progress: DownloadProgress) => void },
    ) => handler(url, options),
  );
}

function installCompletingDownload(onProgressEvents: DownloadProgress[]) {
  installDownloadTask((_url, options) => ({
    cancel: vi.fn(),
    release: vi.fn(),
    downloadAsync: async () => {
      for (const event of onProgressEvents) {
        options.onProgress?.(event);
      }
    },
  }));
}

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.state.current = null;
  mocks.state.writes = [];
  mocks.directoryList.mockReturnValue([]);
  mocks.getVideoDownloadSource.mockResolvedValue({
    urls: ["https://cdn/main.mp4"],
    quality: 64,
    size: 1000,
  });
  mocks.saveVideoToLibrary.mockResolvedValue("saved");
  mocks.ensureMediaWritePermission.mockResolvedValue(true);
  mocks.initVideoDownloadNotifications.mockResolvedValue(undefined);
  mocks.ensureVideoDownloadNotificationPermission.mockResolvedValue(true);
  controller = await import("./controller");
});

describe("video download controller", () => {
  test("downloads the video with referer headers and saves it to the album", async () => {
    installCompletingDownload([
      { bytesWritten: 500, totalBytes: 1000 },
      { bytesWritten: 1000, totalBytes: 1000 },
    ]);

    await expect(controller.startVideoDownload(downloadInput)).resolves.toBe("started");
    await vi.waitFor(() => {
      expect(mocks.state.current?.status).toBe("completed");
    });

    expect(mocks.getVideoDownloadSource).toHaveBeenCalledWith("BV1test", 123);
    expect(mocks.createDownloadTask).toHaveBeenCalledTimes(1);
    expect(mocks.saveVideoToLibrary).toHaveBeenCalledWith(
      expect.stringContaining("/cache/video-downloads/"),
      mocks.ensureMediaWritePermission,
    );
    expect(mocks.state.current?.quality).toBe(64);
    expect(mocks.state.current?.bytesWritten).toBe(1000);
    expect(mocks.state.current?.speed).toBe(0);
    expect(mocks.deleteTarget).toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith("开始下载，可在通知栏查看进度");
    expect(mocks.showToast).toHaveBeenCalledWith("已保存到相册 MiniBili");
    expect(mocks.finishVideoDownloadNotification).toHaveBeenLastCalledWith({
      title: "测试视频",
      body: "已保存到相册 MiniBili",
    });

    const downloadOptions = mocks.createDownloadTask.mock.calls[0][2] as {
      headers: Record<string, string>;
    };
    expect(downloadOptions.headers.referer).toBe("https://www.bilibili.com");
    expect(downloadOptions.headers["user-agent"]?.toLowerCase()).not.toContain("android");
  });

  test("falls back to the backup cdn url when the main url fails", async () => {
    mocks.getVideoDownloadSource.mockResolvedValue({
      urls: ["https://cdn/main.mp4", "https://cdn/backup.mp4"],
      quality: 64,
      size: 1000,
    });
    installDownloadTask((url) => ({
      cancel: vi.fn(),
      release: vi.fn(),
      downloadAsync: async () => {
        if (!url.includes("backup")) {
          throw new Error("403");
        }
      },
    }));

    await controller.startVideoDownload(downloadInput);
    await vi.waitFor(() => {
      expect(mocks.state.current?.status).toBe("completed");
    });

    expect(mocks.createDownloadTask).toHaveBeenCalledTimes(2);
    expect(mocks.createDownloadTask.mock.calls[1][0]).toBe("https://cdn/backup.mp4");
  });

  test("fails the task when every url fails", async () => {
    installDownloadTask(() => ({
      cancel: vi.fn(),
      release: vi.fn(),
      downloadAsync: async () => {
        throw new Error("network down");
      },
    }));

    await controller.startVideoDownload(downloadInput);
    await vi.waitFor(() => {
      expect(mocks.state.current?.status).toBe("failed");
    });

    expect(mocks.state.current?.error).toBe("network down");
    expect(mocks.saveVideoToLibrary).not.toHaveBeenCalled();
    expect(mocks.deleteTarget).toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith("视频下载失败，请稍后重试");
    expect(mocks.finishVideoDownloadNotification).toHaveBeenLastCalledWith({
      title: "测试视频",
      body: "下载失败，请稍后重试",
    });
  });

  test("reports a failure when saving to the album fails", async () => {
    installCompletingDownload([{ bytesWritten: 1000, totalBytes: 1000 }]);
    mocks.saveVideoToLibrary.mockResolvedValue("failed");

    await controller.startVideoDownload(downloadInput);
    await vi.waitFor(() => {
      expect(mocks.state.current?.status).toBe("failed");
    });

    expect(mocks.showToast).toHaveBeenCalledWith("视频下载失败，请稍后重试");
  });

  test("cancels the running download and cleans up", async () => {
    let rejectDownload: ((error: Error) => void) | null = null;
    installDownloadTask(() => ({
      cancel: () => {
        rejectDownload?.(new Error("AbortError"));
      },
      release: vi.fn(),
      downloadAsync: () =>
        new Promise((_resolve, reject) => {
          rejectDownload = reject;
        }),
    }));

    await controller.startVideoDownload(downloadInput);
    await vi.waitFor(() => {
      expect(mocks.createDownloadTask).toHaveBeenCalled();
    });
    expect(controller.isDownloadingVideo(mocks.state.current, "BV1test", 123)).toBe(true);

    controller.cancelVideoDownload();
    await vi.waitFor(() => {
      expect(mocks.state.current?.status).toBe("cancelled");
    });

    expect(mocks.dismissVideoDownloadNotification).toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith("已取消下载");
    expect(mocks.saveVideoToLibrary).not.toHaveBeenCalled();
    expect(mocks.deleteTarget).toHaveBeenCalled();
  });

  test("rejects a second download while one is running", async () => {
    installDownloadTask(() => ({
      cancel: vi.fn(),
      release: vi.fn(),
      downloadAsync: () => new Promise(() => undefined),
    }));

    await expect(controller.startVideoDownload(downloadInput)).resolves.toBe("started");
    await vi.waitFor(() => {
      expect(mocks.createDownloadTask).toHaveBeenCalled();
    });
    expect(controller.isVideoDownloadRunning(mocks.state.current)).toBe(true);

    await expect(
      controller.startVideoDownload({ ...downloadInput, bvid: "BV1other", cid: 456 }),
    ).resolves.toBe("busy");

    controller.cancelVideoDownload();
  });

  test("reports unsupported videos without starting a download", async () => {
    mocks.getVideoDownloadSource.mockRejectedValue(new mocks.VideoDownloadUnsupportedError());

    await expect(controller.startVideoDownload(downloadInput)).resolves.toBe("unsupported");

    expect(mocks.state.current).toBeNull();
    expect(mocks.createDownloadTask).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  test("throttles progress updates while downloading", async () => {
    installCompletingDownload(
      Array.from({ length: 20 }, (_item, index) => ({
        bytesWritten: (index + 1) * 50,
        totalBytes: 1000,
      })),
    );

    await controller.startVideoDownload(downloadInput);
    await vi.waitFor(() => {
      expect(mocks.state.current?.status).toBe("completed");
    });

    const progressWrites = mocks.state.writes.filter(
      (task) => task?.status === "downloading" && (task.bytesWritten ?? 0) > 0,
    );
    expect(progressWrites.length).toBeLessThanOrEqual(1);
    expect(mocks.state.current?.bytesWritten).toBe(1000);
  });
});
