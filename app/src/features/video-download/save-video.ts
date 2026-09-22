import { MiniBiliAlbumName } from "../../components/ImageViewer/image-viewer-download";

export type SaveVideoResult = "saved" | "permission-denied" | "failed";
export type EnsureWritePermission = () => Promise<boolean>;

/**
 * 申请相册写入权限：
 * Android 13+ 保存自己创建的媒体不需要权限，低版本与 iOS 需要（writeOnly）。
 */
export async function ensureMediaWritePermission() {
  const { requestPermissionsAsync } = await import("expo-media-library");
  const permission = await requestPermissionsAsync(true, ["photo"]);
  return permission.status === "granted";
}

/**
 * 把下载好的视频保存进系统相册的 MiniBili 专辑，与图片下载保持一致。
 * 源文件不做删除，由调用方在流程结束后统一清理。
 */
export async function saveVideoToLibrary(
  uri: string,
  ensureWritePermission: EnsureWritePermission,
): Promise<SaveVideoResult> {
  try {
    if (!(await ensureWritePermission())) {
      return "permission-denied";
    }

    const { Album, Asset } = await import("expo-media-library");
    const album = await Album.get(MiniBiliAlbumName);

    if (album) {
      await Asset.create(uri, album);
    } else {
      await Album.create(MiniBiliAlbumName, [uri]);
    }

    return "saved";
  } catch {
    return "failed";
  }
}
