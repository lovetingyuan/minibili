import type {
  OriginalImageAction,
  OriginalImageStatus,
  OriginalImageStatuses,
} from "./image-viewer.types";

export function updateOriginalImageStatuses(
  statuses: OriginalImageStatuses,
  action: OriginalImageAction,
): OriginalImageStatuses {
  if (action.type === "reset") {
    return {};
  }
  return {
    ...statuses,
    [action.uri]:
      action.type === "request" ? "loading" : action.type === "loaded" ? "loaded" : "idle",
  };
}

export function getOriginalImageButtonLabel(status: OriginalImageStatus, isOriginal: boolean) {
  if (isOriginal || status === "loaded") {
    return "已是原图";
  }
  return status === "loading" ? "原图加载中…" : "查看原图";
}
