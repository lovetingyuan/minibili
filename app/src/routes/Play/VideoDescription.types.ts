import type { VideoDescriptionNode } from "@/api/video-info";

export type VideoDescriptionViewProps = {
  text: string;
  nodes?: VideoDescriptionNode[];
  collapsed?: boolean;
  onToggle?: () => void;
  onMentionPress?: (node: VideoDescriptionNode) => void;
};

export type VideoDescriptionProps = {
  text: string;
  nodes?: VideoDescriptionNode[];
};
