import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  albumCreate: vi.fn(),
  albumGet: vi.fn(),
  create: vi.fn(),
  deleteFile: vi.fn(),
  downloadFileAsync: vi.fn(),
}));

vi.mock("expo-file-system", () => {
  class MockFile {
    uri: string;

    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts
        .map((part) => (typeof part === "string" ? part : part.uri))
        .join("/")
        .replace(/\/{2,}/g, "/");
    }

    static downloadFileAsync = mocks.downloadFileAsync;

    delete = mocks.deleteFile;
  }

  return {
    File: MockFile,
    Paths: {
      cache: {
        uri: "/cache",
      },
    },
  };
});

vi.mock("expo-media-library", () => ({
  Album: {
    create: mocks.albumCreate,
    get: mocks.albumGet,
  },
  Asset: {
    create: mocks.create,
  },
}));

import {
  getImageFileName,
  MiniBiliAlbumName,
  saveImageToLibrary,
} from "./image-viewer-download";

describe("image viewer downloads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.albumGet.mockResolvedValue({ id: "album-id" });
  });

  test("keeps a supported image extension from the original URL path", () => {
    expect(
      getImageFileName("https://i0.hdslb.com/bfs/album/photo.jpg@200w.webp?x=1"),
    ).toMatch(/^photo-[0-9a-z]+\.jpg$/);
    expect(getImageFileName("https://example.com/动画.png?width=100")).toMatch(
      /^动画-[0-9a-z]+\.png$/,
    );
  });

  test("falls back to a generated jpg name when the URL has no supported extension", () => {
    expect(getImageFileName("https://example.com/image?id=1")).toMatch(
      /^minibili-[0-9a-z]+\.jpg$/,
    );
  });

  test("does not save an image when write permission is denied", async () => {
    await expect(
      saveImageToLibrary("https://example.com/photo.jpg", vi.fn().mockResolvedValue(false)),
    ).resolves.toBe("permission-denied");

    expect(mocks.downloadFileAsync).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.albumGet).not.toHaveBeenCalled();
  });

  test("returns failed when downloading or saving the asset fails", async () => {
    mocks.downloadFileAsync.mockRejectedValueOnce(new Error("network error"));

    await expect(
      saveImageToLibrary("https://example.com/photo.jpg", vi.fn().mockResolvedValue(true)),
    ).resolves.toBe("failed");

    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.albumGet).not.toHaveBeenCalled();
  });

  test("returns failed without cleaning up when the media library rejects the asset", async () => {
    const file = {
      uri: "file:///cache/photo.jpg",
      delete: mocks.deleteFile,
    };
    mocks.downloadFileAsync.mockResolvedValueOnce(file);
    mocks.create.mockRejectedValueOnce(new Error("permission error"));

    await expect(
      saveImageToLibrary("https://example.com/photo.jpg", vi.fn().mockResolvedValue(true)),
    ).resolves.toBe("failed");

    expect(mocks.create).toHaveBeenCalledExactlyOnceWith("file:///cache/photo.jpg", {
      id: "album-id",
    });
    expect(mocks.deleteFile).not.toHaveBeenCalled();
  });

  test("adds to an existing MiniBili album and cleans up on success", async () => {
    const file = {
      uri: "file:///cache/photo.jpg",
      delete: mocks.deleteFile,
    };
    mocks.downloadFileAsync.mockResolvedValueOnce(file);
    mocks.create.mockResolvedValueOnce({ id: "asset-id" });

    await expect(
      saveImageToLibrary("https://example.com/photo.jpg", vi.fn().mockResolvedValue(true)),
    ).resolves.toBe("saved");

    expect(mocks.downloadFileAsync).toHaveBeenCalledOnce();
    expect(mocks.albumGet).toHaveBeenCalledExactlyOnceWith(MiniBiliAlbumName);
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith("file:///cache/photo.jpg", {
      id: "album-id",
    });
    expect(mocks.deleteFile).toHaveBeenCalledOnce();
  });

  test("creates the MiniBili album with the file when it does not exist", async () => {
    const file = {
      uri: "file:///cache/photo.jpg",
      delete: mocks.deleteFile,
    };
    mocks.albumGet.mockResolvedValueOnce(null);
    mocks.albumCreate.mockResolvedValueOnce({ id: "new-album-id" });
    mocks.downloadFileAsync.mockResolvedValueOnce(file);

    await expect(
      saveImageToLibrary("https://example.com/photo.jpg", vi.fn().mockResolvedValue(true)),
    ).resolves.toBe("saved");

    expect(mocks.albumGet).toHaveBeenCalledExactlyOnceWith(MiniBiliAlbumName);
    expect(mocks.albumCreate).toHaveBeenCalledExactlyOnceWith(MiniBiliAlbumName, [
      "file:///cache/photo.jpg",
    ]);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.deleteFile).toHaveBeenCalledOnce();
  });
});
