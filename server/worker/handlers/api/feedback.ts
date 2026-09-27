import { Resend } from "resend";

import {
  FEEDBACK_IMAGE_MIME_TYPES,
  FEEDBACK_MAX_BODY_BYTES,
  FEEDBACK_MAX_IMAGE_BYTES,
  FEEDBACK_MAX_LENGTH,
} from "../../../../shared/feedback";
import type {
  FeedbackImageMimeType,
  FeedbackRequest,
} from "../../../../shared/feedback";
import type { AppContext } from "../../types";
import { isRecord, readJsonBody, RequestPayloadTooLargeError } from "../../utils/request";

const USER_DIRECTORY_NAME = "global";
const FEEDBACK_FROM = "MiniBili <minibili_feedback@tingyuan.in>";
const FEEDBACK_TO = "minibili@tingyuan.in";
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
const MAX_APP_VERSION_LENGTH = 100;

const MIME_EXTENSION: Record<FeedbackImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function countCharacters(value: string) {
  return Array.from(value).length;
}

function isFeedbackImageMimeType(value: unknown): value is FeedbackImageMimeType {
  return (
    typeof value === "string" &&
    FEEDBACK_IMAGE_MIME_TYPES.some((mimeType) => mimeType === value)
  );
}

function getDecodedBase64Size(content: string) {
  if (!content || content.length % 4 !== 0 || !BASE64_PATTERN.test(content)) {
    return null;
  }
  const padding = content.endsWith("==") ? 2 : content.endsWith("=") ? 1 : 0;
  return (content.length / 4) * 3 - padding;
}

function getBase64Prefix(content: string) {
  try {
    return Uint8Array.from(atob(content.slice(0, 32)), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function hasExpectedImageSignature(mimeType: FeedbackImageMimeType, bytes: Uint8Array) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    );
  }
  if (mimeType === "image/gif") {
    const signature = String.fromCharCode(...bytes.slice(0, 6));
    return signature === "GIF87a" || signature === "GIF89a";
  }
  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

function parseFeedbackRequest(value: unknown): FeedbackRequest | null {
  if (!isRecord(value) || typeof value.feedback !== "string") {
    return null;
  }
  const feedback = value.feedback.trim();
  if (!feedback || countCharacters(feedback) > FEEDBACK_MAX_LENGTH) {
    return null;
  }

  const biliId = value.biliId;
  if (biliId !== null && (typeof biliId !== "string" || !/^\d{1,32}$/.test(biliId))) {
    return null;
  }

  const rawAppVersion = value.appVersion;
  if (
    rawAppVersion !== undefined &&
    rawAppVersion !== null &&
    (typeof rawAppVersion !== "string" ||
      !rawAppVersion.trim() ||
      rawAppVersion.length > MAX_APP_VERSION_LENGTH)
  ) {
    return null;
  }
  const appVersion = typeof rawAppVersion === "string" ? rawAppVersion.trim() : null;

  if (value.image === undefined) {
    return { feedback, biliId, appVersion };
  }
  if (
    !isRecord(value.image) ||
    typeof value.image.filename !== "string" ||
    !value.image.filename.trim() ||
    value.image.filename.length > 255 ||
    !isFeedbackImageMimeType(value.image.mimeType) ||
    typeof value.image.content !== "string"
  ) {
    return null;
  }

  const imageSize = getDecodedBase64Size(value.image.content);
  const prefix = getBase64Prefix(value.image.content);
  if (
    imageSize === null ||
    imageSize > FEEDBACK_MAX_IMAGE_BYTES ||
    !prefix ||
    !hasExpectedImageSignature(value.image.mimeType, prefix)
  ) {
    return null;
  }

  return {
    feedback,
    biliId,
    appVersion,
    image: {
      filename: value.image.filename,
      mimeType: value.image.mimeType,
      content: value.image.content,
    },
  };
}

async function hashIpAddress(ipAddress: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ipAddress));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function handleSubmitFeedback(c: AppContext) {
  c.header("Cache-Control", "no-store");
  if (!c.req.header("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return c.json({ success: false, error: "请求格式错误" }, 400);
  }

  let body: unknown;
  try {
    body = await readJsonBody(c.req.raw, FEEDBACK_MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) {
      return c.json({ success: false, error: "反馈图片不能超过 5MB" }, 413);
    }
    throw error;
  }

  const feedback = parseFeedbackRequest(body);
  if (isRecord(body) && isRecord(body.image) && typeof body.image.content === "string") {
    const imageSize = getDecodedBase64Size(body.image.content);
    if (imageSize !== null && imageSize > FEEDBACK_MAX_IMAGE_BYTES) {
      return c.json({ success: false, error: "反馈图片不能超过 5MB" }, 413);
    }
  }
  if (!feedback) {
    return c.json({ success: false, error: "反馈内容或图片格式不正确" }, 400);
  }

  const ipHash = await hashIpAddress(c.req.header("CF-Connecting-IP") ?? "local-development");
  const quota = await c.env.USER_DIRECTORY.getByName(USER_DIRECTORY_NAME).consumeFeedbackQuota({
    ipHash,
    usedAt: Date.now(),
  });
  if (!quota.allowed) {
    console.warn(JSON.stringify({ message: "feedback rate limited", scope: quota.scope }));
    return c.json({ success: false, error: "提交过于频繁，请稍后再试" }, 429);
  }

  const displayBiliId = feedback.biliId ?? "未登录";
  const displayAppVersion = feedback.appVersion ?? "未知";
  const resend = new Resend(c.env.RESEND_API_KEY);
  try {
    const { error } = await resend.emails.send({
      from: FEEDBACK_FROM,
      to: FEEDBACK_TO,
      subject: `[MiniBili 反馈] B站ID：${displayBiliId}`,
      text: [
        `B站ID：${displayBiliId}`,
        `应用版本：${displayAppVersion}`,
        "",
        "反馈内容：",
        feedback.feedback,
      ].join("\n"),
      attachments: feedback.image
        ? [
            {
              content: feedback.image.content,
              filename: `feedback-${Date.now()}.${MIME_EXTENSION[feedback.image.mimeType]}`,
            },
          ]
        : undefined,
    });
    if (!error) {
      return c.json({ success: true });
    }
    console.error(
      JSON.stringify({
        message: "feedback email failed",
        error: error.message,
        biliId: feedback.biliId,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "feedback email request failed",
        error: error instanceof Error ? error.message : String(error),
        biliId: feedback.biliId,
      }),
    );
  }
  return c.json({ success: false, error: "反馈发送失败，请稍后重试" }, 502);
}
