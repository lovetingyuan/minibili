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
