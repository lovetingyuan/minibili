// 仅清理已经废弃的本地状态，不触碰仍在使用的数据或 B站记录。
export async function clearLegacyCollections(removeItem: (key: string) => Promise<void>) {
  const results = await Promise.allSettled(
    [
      "Store:$collectedVideos",
      "Store:$watchedVideos",
      "Store:$localPlayProgress",
      "Store:$followingDynamicsUnreadMap",
    ].map(async (key) => removeItem(key)),
  );
  // 不记录成功标记，任何一项失败都会在下次启动重试。
  return results.every((result) => result.status === "fulfilled");
}
