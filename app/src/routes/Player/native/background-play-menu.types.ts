import type {
  BackgroundPlayDurationMinutes,
  BackgroundPlaySelection,
} from "@/types/background-playback";

export type BackgroundPlayMenuProps = {
  enabled: boolean;
  durationMinutes: BackgroundPlayDurationMinutes;
  opened: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (selection: BackgroundPlaySelection) => void;
};
