import type { File } from "expo-file-system";

import type { FeedbackImageMimeType } from "../../../shared/feedback";

export type SelectedFeedbackImage = {
  file: File;
  mimeType: FeedbackImageMimeType;
};

export type SubmitFeedbackInput = {
  feedback: string;
  biliId: string | null;
  image: SelectedFeedbackImage | null;
};
