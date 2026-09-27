import * as Application from "expo-application";
import useSWR from "swr";

import { GhProxy, githubLink } from "@/constants";
import { enqueueToast } from "@/features/toast";
import { useStore } from "@/store";

import { appReleaseResponseSchema } from "./check-update.schema";
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
  releases: AppRelease[] | undefined,
  currentVersion: string,
): AvailableAppUpdate | null {
  let latestRelease: AppRelease | null = null;
  let latestVersion: string | null = null;

  for (const release of releases ?? []) {
    const releaseVersion = getReleaseVersion(release);
    if (!releaseVersion) {
      continue;
    }
    if (!latestVersion || isVersionNewer(releaseVersion, latestVersion)) {
      latestRelease = release;
      latestVersion = releaseVersion;
    }
  }

  if (!latestRelease || !latestVersion || !isVersionNewer(latestVersion, currentVersion)) {
    return null;
  }

  return {
    release: latestRelease,
    currentVersion,
    latestVersion,
    downloadLink: `${GhProxy}/${githubLink}/releases/download/v${latestVersion}/${latestRelease.version}.apk`,
  };
}

export async function fetchVersion() {
  const response = await fetch(
    "https://tingyuan.in/api/github/releases?user=lovetingyuan&repo=minibili&_t=" + Date.now(),
  );
  if (!response.ok) {
    throw new Error("检查更新失败：" + response.status);
  }

  const payload = appReleaseResponseSchema.parse(await response.json());
  if (payload.code !== 0) {
    throw new Error(payload.code + ":" + payload.message);
  }
  return payload.data;
}

export function useAppUpdateInfo() {
  const { set$checkAppUpdateTime, setAppUpdateDialogVisible } = useStore();
  const currentVersion = Application.nativeApplicationVersion ?? "0.0.0";
  const android = process.env.EXPO_OS === "android";
  const {
    data: list,
    isValidating,
    error,
    mutate,
  } = useSWR(android ? "$check-app-update" : null, fetchVersion);
  const availableUpdate = android ? resolveAvailableAppUpdate(list, currentVersion) : null;

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
      const releases = await mutate();
      const refreshedUpdate = resolveAvailableAppUpdate(releases, currentVersion);
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
    changeList: list,
    loading: isValidating,
    error,
    showUpdateDialog,
    hideUpdateDialog,
    checkUpdate,
  };
}

export type { AppRelease, AvailableAppUpdate } from "./check-update.types";
