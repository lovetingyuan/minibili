// 仅清理旧版 App 的本地收藏，不触碰其他持久化数据或 B站收藏。
export async function clearLegacyCollections(removeItem: (key: string) => Promise<void>) {
  try {
    await removeItem("Store:$collectedVideos");
    return true;
  } catch {
    // 不记录成功标记，下次启动会再次尝试。
    return false;
  }
}
