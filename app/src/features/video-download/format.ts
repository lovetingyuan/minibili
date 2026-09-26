const ByteUnits = ["B", "KB", "MB", "GB", "TB"];

/**
 * 把字节数格式化成便于阅读的文本，如 "43.2 MB"。
 * 小于 100 的数值保留一位小数，整数结果不显示小数位。
 */
export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < ByteUnits.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = value >= 100 ? 0 : 1;
  return `${value.toFixed(digits).replace(/\.0$/, "")} ${ByteUnits[unitIndex]}`;
}

/**
 * 下载速度文本，如 "2.1 MB/s"；速度未知时返回空字符串。
 */
export function formatSpeed(bytesPerSecond: number) {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
    return "";
  }
  return `${formatBytes(bytesPerSecond)}/s`;
}

/**
 * 通知正文里的下载信息，如 "45% · 43.2 MB / 95.5 MB · 2.1 MB/s"。
 * 总大小未知时只展示已下载体积，下载完成后不再展示速度。
 */
export function formatDownloadProgress(progress: {
  bytesWritten: number;
  totalBytes: number;
  speed?: number;
}) {
  const { bytesWritten, totalBytes, speed = 0 } = progress;
  const sizeKnown = totalBytes > 0;
  const percent = sizeKnown ? Math.min(100, Math.floor((bytesWritten / totalBytes) * 100)) : 0;
  const sizeText = sizeKnown
    ? `${formatBytes(bytesWritten)} / ${formatBytes(totalBytes)}`
    : formatBytes(bytesWritten);
  return [sizeKnown ? `${percent}%` : "", sizeText, percent >= 100 ? "" : formatSpeed(speed)]
    .filter(Boolean)
    .join(" · ");
}

/**
 * 用相邻两次采样算瞬时速度（字节/秒），采样间隔或增量无效时返回 0。
 */
export function resolveDownloadSpeed(sample: {
  previousBytes: number;
  previousTime: number;
  bytesWritten: number;
  time: number;
}) {
  const elapsed = sample.time - sample.previousTime;
  const delta = sample.bytesWritten - sample.previousBytes;
  if (elapsed <= 0 || delta <= 0) {
    return 0;
  }
  return Math.round((delta / elapsed) * 1000);
}
