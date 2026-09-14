/**
 * 视频下载任务状态。
 * downloading - 正在下载（含解析下载地址阶段）
 * saving      - 下载完成，正在保存到系统相册
 * completed   - 已保存到相册
 * failed      - 下载或保存失败
 * cancelled   - 用户取消
 */
type VideoDownloadStatus = "downloading" | "saving" | "completed" | "failed" | "cancelled";

/**
 * 当前下载任务，同一时间只会有一个。
 */
export type VideoDownloadTask = {
  id: string;
  bvid: string;
  cid: number;
  /** 分P 序号，从 1 开始 */
  page: number;
  /** 通知标题与文件名使用的标题 */
  title: string;
  /** 服务端返回的清晰度，如 64(720P)；未知时为 0 */
  quality: number;
  /** 文件总字节数，未知时为 0 */
  totalBytes: number;
  bytesWritten: number;
  /** 瞬时下载速度（字节/秒） */
  speed: number;
  status: VideoDownloadStatus;
  error?: string;
  startedAt: number;
};

export type VideoDownloadInput = {
  bvid: string;
  cid: number;
  title?: string;
  /** 当前分P 序号，默认 1 */
  page?: number;
  /** 当前分P 标题，用于多P 视频的通知文案与文件名 */
  pageTitle?: string;
};

export type VideoDownloadStartResult = "started" | "busy" | "unsupported" | "failed";
