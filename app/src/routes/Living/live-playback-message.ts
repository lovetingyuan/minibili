import type { LiveWebViewMessage } from "./live-playback.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getLiveRoomId(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "live.bilibili.com"
      ? (parsed.pathname.match(/^\/(?:h5\/)?(\d+)(?:\/|$)/)?.[1] ?? "")
      : "";
  } catch {
    return "";
  }
}

export function parseLiveWebViewMessage(data: string): LiveWebViewMessage | null {
  try {
    const message: unknown = JSON.parse(data);
    if (!isRecord(message)) {
      return null;
    }
    if (message.action === "update-live-info" && typeof message.payload === "string") {
      const payload: unknown = JSON.parse(message.payload);
      if (
        isRecord(payload) &&
        typeof payload.url === "string" &&
        payload.callback === "__update_live_info"
      ) {
        return {
          action: message.action,
          payload: { url: payload.url, callback: payload.callback },
        };
      }
    }
    if (typeof message.roomId !== "string") {
      return null;
    }
    if (message.action === "live-page-ready") {
      return { action: message.action, roomId: message.roomId };
    }
    if (message.action === "background-play" && typeof message.enabled === "boolean") {
      return { action: message.action, roomId: message.roomId, enabled: message.enabled };
    }
    if (message.action === "live-mute" && typeof message.muted === "boolean") {
      return { action: message.action, roomId: message.roomId, muted: message.muted };
    }
    const payload = message.payload;
    if (
      message.action === "live-playback-state" &&
      isRecord(payload) &&
      typeof payload.playing === "boolean" &&
      typeof payload.muted === "boolean" &&
      typeof payload.volume === "number" &&
      Number.isFinite(payload.volume) &&
      payload.volume >= 0 &&
      payload.volume <= 1
    ) {
      return {
        action: message.action,
        roomId: message.roomId,
        payload: { playing: payload.playing, muted: payload.muted, volume: payload.volume },
      };
    }
  } catch {
    // 网页消息不完整时忽略，不影响直播。
  }
  return null;
}
