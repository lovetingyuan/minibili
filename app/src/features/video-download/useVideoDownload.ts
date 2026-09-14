import { useStore } from "../../store";
import { cancelVideoDownload, startVideoDownload } from "./controller";

/**
 * 播放页菜单使用的下载状态与操作入口。
 */
export function useVideoDownload() {
  const { videoDownloadTask } = useStore();
  return {
    task: videoDownloadTask,
    start: startVideoDownload,
    cancel: cancelVideoDownload,
  };
}
