// 仅清理旧版 App 的本地收藏、观看历史和本地播放记录，不触碰其他数据或 B站记录。
export async function clearLegacyCollections(removeItem: (key: string) => Promise<void>) {
  const results = await Promise.allSettled(
    ["Store:$collectedVideos", "Store:$watchedVideos", "Store:$localPlayProgress"].map(
      async (key) => removeItem(key),
    ),
  );
  // 不记录成功标记，任何一项失败都会在下次启动重试。
  return results.every((result) => result.status === "fulfilled");
}
