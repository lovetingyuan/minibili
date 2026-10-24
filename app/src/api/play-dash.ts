import type { DashManifest, DashStream, VideoQuality } from "./play-url.types";

export const VIDEO_QUALITIES: readonly VideoQuality[] = [80, 64, 32, 16];

export function formatVideoQuality(quality: VideoQuality) {
  return { 16: "360P", 32: "480P", 64: "720P", 80: "1080P" }[quality];
}

export function resolveAvailableQuality(
  preferred: VideoQuality,
  available: readonly VideoQuality[],
): VideoQuality | undefined {
  return (
    VIDEO_QUALITIES.find((quality) => quality <= preferred && available.includes(quality)) ??
    [...VIDEO_QUALITIES].reverse().find((quality) => available.includes(quality))
  );
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    return (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character] ??
      character
    );
  });
}

function collectStreamUrls(stream: DashStream) {
  // MCDN 可能持续慢速回包而不触发读取超时，音视频都优先使用普通 CDN。
  return [...new Set([stream.base_url, ...(stream.backup_url ?? [])])].sort(
    (left, right) =>
      Number(new URL(left).hostname.endsWith(".mcdn.bilivideo.cn")) -
      Number(new URL(right).hostname.endsWith(".mcdn.bilivideo.cn")),
  );
}

function createRepresentation(stream: DashStream, url: string, kind: "video" | "audio") {
  const dimensions = kind === "video" ? ` width="${stream.width}" height="${stream.height}"` : "";
  return `<AdaptationSet contentType="${kind}" mimeType="${escapeXml(stream.mime_type)}">
    <Representation id="${stream.id}" bandwidth="${stream.bandwidth}" codecs="${escapeXml(stream.codecs)}"${dimensions}>
      <BaseURL>${escapeXml(url)}</BaseURL>
      <SegmentBase indexRange="${stream.segment_base.index_range}">
        <Initialization range="${stream.segment_base.initialization}"/>
      </SegmentBase>
    </Representation>
  </AdaptationSet>`;
}

/** 每份清单只放一档视频，防止 ExoPlayer 自适应切到其它清晰度。 */
export function createDashPlaySources(
  dash: DashManifest | null | undefined,
  preferred: VideoQuality,
) {
  const audio = dash?.audio
    ?.filter((stream) => stream.mime_type === "audio/mp4" && stream.codecs.startsWith("mp4a."))
    .sort((left, right) => right.bandwidth - left.bandwidth || right.id - left.id)[0];
  const videos =
    dash?.video.filter(
      (stream) =>
        stream.codecid === 7 &&
        stream.mime_type === "video/mp4" &&
        stream.codecs.startsWith("avc1."),
    ) ?? [];
  const availableQualities = audio
    ? VIDEO_QUALITIES.filter((quality) => videos.some((stream) => stream.id === quality))
    : [];
  const quality = resolveAvailableQuality(preferred, availableQualities);
  const video = videos.find((stream) => stream.id === quality);
  if (!dash || !audio || !video) {
    return { urls: [], quality, availableQualities };
  }

  // 音视频各自都有备用 CDN，遍历组合才能同时覆盖音轨或视频镜像失效。
  const urls = collectStreamUrls(video).flatMap((videoUrl) =>
    collectStreamUrls(audio).map((audioUrl) => {
      const mpd = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011" mediaPresentationDuration="PT${dash.duration}S" minBufferTime="PT1.5S">
  <Period start="PT0S" duration="PT${dash.duration}S">
    ${createRepresentation(video, videoUrl, "video")}
    ${createRepresentation(audio, audioUrl, "audio")}
  </Period>
</MPD>`;
      // Android Uri 会先解码百分号；Base64 避免 CDN 查询里的逗号被误当作 data URI 分隔符。
      return `data:application/dash+xml;base64,${fromByteArray(new TextEncoder().encode(mpd))}`;
    }),
  );
  return { urls, quality, availableQualities };
}
import { fromByteArray } from "base64-js";
