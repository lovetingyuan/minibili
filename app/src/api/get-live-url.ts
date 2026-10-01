import useSWR from "swr";
import fetcher from "./fetcher";
import { LivePlayInfoSchema } from "./get-live-url.schema";
import type { LivePlayInfo, LiveStreamSource } from "./get-live-url.types";

async function fetchLivePlayInfo(roomId: string): Promise<LivePlayInfo> {
  const query = new URLSearchParams({
    room_id: roomId,
    protocol: "1",
    format: "1,2",
    codec: "0",
    qn: "80",
    platform: "h5",
    ptype: "8",
    dolby: "0",
  });
  const payload = await fetcher<unknown>(
    `https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?${query}`,
  );
  const data = LivePlayInfoSchema.parse(payload);
  const sources: LiveStreamSource[] = [];
  const seen = new Set<string>();
  for (const formatName of ["fmp4", "ts"] as const) {
    for (const stream of data.playurl_info?.playurl?.stream ?? []) {
      if (stream.protocol_name !== "http_hls") {
        continue;
      }
      for (const format of stream.format) {
        if (format.format_name !== formatName) {
          continue;
        }
        for (const codec of format.codec) {
          if (codec.codec_name !== "avc" || codec.drm) {
            continue;
          }
          for (const info of codec.url_info) {
            const uri = `${info.host}${codec.base_url}${info.extra}`;
            if (seen.has(uri) || !uri.startsWith("https://")) {
              continue;
            }
            seen.add(uri);
            const expires = Number(new URL(uri).searchParams.get("expires"));
            sources.push({ uri, expiresAt: expires > 0 ? expires * 1000 : null });
          }
        }
      }
    }
  }
  return { roomId: String(data.room_id), isLive: data.live_status === 1, sources };
}

export default function useLiveUrl(roomId: string) {
  const { data, error, mutate } = useSWR<LivePlayInfo, Error>(
    roomId ? ["live-play-info", roomId] : null,
    ([, id]: [string, string]) => fetchLivePlayInfo(id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      // 全局 SWR 配置将后台视为离线；原生直播服务仍然需要刷新失效地址。
      isOnline: () => true,
    },
  );
  return { data, error, refresh: () => mutate() };
}
