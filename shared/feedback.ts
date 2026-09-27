export const FEEDBACK_MAX_LENGTH = 2_000;
export const FEEDBACK_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const FEEDBACK_MAX_BODY_BYTES = 7 * 1024 * 1024;

export const FEEDBACK_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type FeedbackImageMimeType = (typeof FEEDBACK_IMAGE_MIME_TYPES)[number];

export type FeedbackImagePayload = {
  filename: string;
  mimeType: FeedbackImageMimeType;
  content: string;
};

export type FeedbackRequest = {
  feedback: string;
  biliId: string | null;
  appVersion: string | null;
  image?: FeedbackImagePayload;
};

export type FeedbackResponse =
  | { success: true }
  | { success: false; error: string };
