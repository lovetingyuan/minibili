import React from "react";

import { cancelVideoDownload } from "@/features/video-download/controller";
import {
  addVideoDownloadCancelListener,
  initVideoDownloadNotifications,
} from "@/features/video-download/notifications";

/**
 * 视频下载通知的全局接线：
 * 初始化通知渠道/分类，并监听通知上的「取消」按钮，
 * 这样即使已经离开播放页，也能从通知栏取消下载。
 */
function VideoDownloadManager() {
  React.useEffect(() => {
    void initVideoDownloadNotifications();
    const subscription = addVideoDownloadCancelListener(() => {
      cancelVideoDownload();
    });
    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}

export default VideoDownloadManager;
