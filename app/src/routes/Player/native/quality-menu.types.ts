import type { VideoQuality } from "@/api/play-url.types";

export type QualityMenuProps = {
  quality: VideoQuality | undefined;
  availableQualities: readonly VideoQuality[];
  opened: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (quality: VideoQuality) => void;
};
