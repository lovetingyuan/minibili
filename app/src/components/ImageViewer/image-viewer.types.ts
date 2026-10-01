import type { GestureViewerRenderItemInfo } from "react-native-gesture-image-viewer";

export type ImageViewerInput = {
  src: string;
  width: number;
  height: number;
  ratio?: number;
};

export type ImageViewerItem = {
  uri: string;
  originalUri: string;
  width: number;
  height: number;
};

export type OriginalImageStatus = "idle" | "loading" | "loaded";

export type OriginalImageStatuses = Record<string, OriginalImageStatus>;

export type OriginalImageAction =
  | { type: "request"; uri: string }
  | { type: "loaded"; uri: string }
  | { type: "failed"; uri: string }
  | { type: "reset" };

export type ImageViewerGalleryProps = {
  images: ImageViewerItem[];
  initialIndex: number;
  width: number;
  height: number;
  onClose: () => void;
};

export type ImageViewerSourceProps = {
  image: ImageViewerItem;
  info: GestureViewerRenderItemInfo;
  originalStatus: OriginalImageStatus;
  onOriginalLoaded: (uri: string) => void;
  onOriginalFailed: (uri: string) => void;
};

export type ImageViewerControlsProps = {
  images: ImageViewerItem[];
  initialIndex: number;
  originalImageStatuses: OriginalImageStatuses;
  onClose: () => void;
  onOriginalRequest: (uri: string) => void;
};
