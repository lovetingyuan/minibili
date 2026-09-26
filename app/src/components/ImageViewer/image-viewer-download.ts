export type SaveImageResult = "saved" | "permission-denied" | "failed";
export type EnsureWritePermission = () => Promise<boolean>;

export const MiniBiliAlbumName = "MiniBili";

const SupportedImageExtension = /\.(avif|gif|jpe?g|png|webp)$/i;
const UnsafeFileNameCharacter = /[\\/:*?"<>|]/g;

function sanitizeFileName(name: string) {
  return name
    .replace(UnsafeFileNameCharacter, "_")
    .replace(/[.\s_-]+$/g, "")
    .slice(0, 120);
}

export function getImageFileName(uri: string) {
  const suffix = Date.now().toString(36);

  try {
    const rawPathname = new URL(uri).pathname;
    const pathname = rawPathname.replace(/^(.*\.(?:avif|gif|jpe?g|png|webp))@[^/?#]*$/i, "$1");
    const basename = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
    const match = basename.match(SupportedImageExtension);

    if (match?.[1]) {
      const baseName = sanitizeFileName(basename.slice(0, match.index));
      const extension = match[1].toLowerCase();
      return `${baseName || "minibili"}-${suffix}.${extension}`;
    }
  } catch {
    // Invalid URLs fall back to a generated filename.
  }

  return `minibili-${suffix}.jpg`;
}

export async function saveImageToLibrary(
  uri: string,
  ensureWritePermission: EnsureWritePermission,
): Promise<SaveImageResult> {
  try {
    if (!(await ensureWritePermission())) {
      return "permission-denied";
    }

    const [{ Album, Asset }, { File, Paths }] = await Promise.all([
      import("expo-media-library"),
      import("expo-file-system"),
    ]);
    const destination = new File(Paths.cache, getImageFileName(uri));
    const file = await File.downloadFileAsync(uri, destination);
    const album = await Album.get(MiniBiliAlbumName);

    if (album) {
      await Asset.create(file.uri, album);
    } else {
      await Album.create(MiniBiliAlbumName, [file.uri]);
    }

    try {
      file.delete();
    } catch {
      // Cache cleanup is best-effort and must not hide a successful save.
    }

    return "saved";
  } catch {
    return "failed";
  }
}
