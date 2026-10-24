import type { VideoBadgeTone } from "@/components/VideoBadge";
import type { VideoQuality } from "@/api/play-url.types";

export type PlayerCoverProps = {
  duration?: number;
  isMetered: boolean;
  quality: VideoQuality | undefined;
  availableQualities: readonly VideoQuality[];
  onQualityChange: (quality: VideoQuality) => void;
  onStart: () => void;
  badgeLabel?: string | null;
  badgeTone?: VideoBadgeTone;
};
