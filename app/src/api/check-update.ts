import * as Application from "expo-application";
import he from "he";
import useSWR from "swr";

import { GhProxy, githubLink } from "@/constants";
import { enqueueToast } from "@/features/toast";
import { useStore } from "@/store";

import { appReleaseSchema } from "./check-update.schema";
import type { AppRelease, AvailableAppUpdate } from "./check-update.types";

const RELEASE_NAME_PATTERN = /^minibili-(\d+(?:\.\d+)*)$/;

function parseVersionParts(version: string) {
  if (!/^\d+(?:\.\d+)*$/.test(version)) {
    return null;
  }
  return version.split(".").map(Number);
}

/** candidate 严格高于 current 时返回 true。项目发布版本只接受纯数字点分格式。 */
export function isVersionNewer(candidate: string, current: string) {
  const candidateParts = parseVersionParts(candidate);
  const currentParts = parseVersionParts(current);
  if (!candidateParts || !currentParts) {
    return false;
  }

  const length = Math.max(candidateParts.length, currentParts.length);
  for (let index = 0; index < length; index += 1) {
    const candidatePart = candidateParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;
    if (candidatePart !== currentPart) {
      return candidatePart > currentPart;
    }
  }
  return false;
}

function getReleaseVersion(release: AppRelease) {
  return RELEASE_NAME_PATTERN.exec(release.version)?.[1] ?? null;
}

export function resolveAvailableAppUpdate(
  latestRelease: AppRelease | null | undefined,
  currentVersion: string,
): AvailableAppUpdate | null {
  if (!latestRelease) {
    return null;
  }
  const latestVersion = getReleaseVersion(latestRelease);

  if (!latestVersion || !isVersionNewer(latestVersion, currentVersion)) {
    return null;
  }

  return {
    release: latestRelease,
    currentVersion,
    latestVersion,
    downloadLink: `${GhProxy}/${latestRelease.downloadUrl}`,
  };
}

export async function fetchVersion(): Promise<AppRelease | null> {
  // latest 网页只跳转到正式的 Latest release，避免 REST API 限流。
  const response = await fetch(`${githubLink}/releases/latest`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("检查更新失败：" + response.status);
  }

  const tagPath = response.url.startsWith(`${githubLink}/releases/tag/`)
    ? response.url.slice(`${githubLink}/releases/tag/`.length)
    : "";
  const version = /^v(\d+(?:\.\d+)*)$/.exec(tagPath)?.[1];
  if (!version) {
    throw new Error("最新正式版本的 tag 格式无效");
  }
  const releaseName = `minibili-${version}`;
  const html = await response.text();
  const assetsResponse = await fetch(`${githubLink}/releases/expanded_assets/v${version}`);
  if (!assetsResponse.ok) {
    throw new Error("检查更新失败：" + assetsResponse.status);
  }
  const assetsHtml = await assetsResponse.text();
  const downloadPath = `/lovetingyuan/minibili/releases/download/v${version}/${releaseName}.apk`;
  if (!assetsHtml.includes(`href="${downloadPath}"`)) {
    throw new Error("最新正式版本缺少 APK 附件");
  }
  const body =
    /<div\b[^>]*data-test-selector="body-content"[^>]*>([\s\S]*?)<\/div>/i.exec(html)?.[1] ?? "";
  const changelog = he
    .decode(
      body
        .replace(/<br\s*\/?>|<\/(?:p|li|h[1-6]|div|pre|blockquote)>/gi, "\n")
        .replace(/<[^>]+>/g, ""),
    )
    .trim();
  return appReleaseSchema.parse({
    version: releaseName,
    changelog,
    downloadUrl: `https://github.com${downloadPath}`,
  });
}

export function useAppUpdateInfo() {
  const { set$checkAppUpdateTime, setAppUpdateDialogVisible } = useStore();
  const currentVersion = Application.nativeApplicationVersion ?? "0.0.0";
  const android = process.env.EXPO_OS === "android";
  const {
    data: latestRelease,
    isValidating,
    error,
    mutate,
  } = useSWR(android ? "$check-app-update-latest-release" : null, fetchVersion);
  const availableUpdate = android ? resolveAvailableAppUpdate(latestRelease, currentVersion) : null;

  function showUpdateDialog() {
    if (!availableUpdate) {
      return false;
    }
    set$checkAppUpdateTime(Date.now());
    setAppUpdateDialogVisible(true);
    return true;
  }

  function hideUpdateDialog() {
    setAppUpdateDialogVisible(false);
  }

  async function checkUpdate() {
    if (!android || isValidating) {
      return;
    }
    try {
      const release = await mutate();
      const refreshedUpdate = resolveAvailableAppUpdate(release, currentVersion);
      if (refreshedUpdate) {
        set$checkAppUpdateTime(Date.now());
        setAppUpdateDialogVisible(true);
      } else {
        enqueueToast("已是最新版本", false);
      }
    } catch {
      enqueueToast("检查更新失败，请稍后重试", false);
    }
  }

  return {
    currentVersion,
    availableUpdate,
    hasUpdate: availableUpdate !== null,
    changeList: latestRelease ? [latestRelease] : [],
    loading: isValidating,
    error,
    showUpdateDialog,
    hideUpdateDialog,
    checkUpdate,
  };
}

export type { AppRelease, AvailableAppUpdate } from "./check-update.types";
