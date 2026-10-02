/**
 * Vitest 用的 expo-file-system 替身：只覆盖测试图里会静态引用的导出，
 * 不实现真实文件读写（相关逻辑不在单测范围内）。
 */

export class Directory {
  constructor(...uris) {
    this.uris = uris;
  }

  create() {}

  list() {
    return [];
  }
}

export class File {
  constructor(...uris) {
    this.uris = uris;
    this.exists = false;
    this.size = 0;
    this.uri = String(uris.at(-1) ?? "");
    this.contentUri = this.uri;
  }

  static createDownloadTask(url, file, options) {
    return {
      downloadAsync: async () => options?.onProgress?.({ bytesWritten: 0, totalBytes: 0 }),
      cancel() {},
      release() {},
    };
  }

  delete() {}
}

export const Paths = {
  cache: "/tmp/minibili-cache",
};
