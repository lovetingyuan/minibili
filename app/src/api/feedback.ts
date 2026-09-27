import * as Application from "expo-application";
import Constants from "expo-constants";
import useSWRMutation from "swr/mutation";

import type { FeedbackRequest } from "../../../shared/feedback";
import { FEEDBACK_MAX_IMAGE_BYTES } from "../../../shared/feedback";
import { serverUrl } from "../constants";
import { FeedbackResponseSchema } from "./feedback.schema";
import type { SubmitFeedbackInput } from "./feedback.types";

const FEEDBACK_MUTATION_KEY = "feedback-submit";
const FEEDBACK_TIMEOUT_MS = 30_000;

async function submitFeedback(input: SubmitFeedbackInput) {
  if (input.image && input.image.file.size > FEEDBACK_MAX_IMAGE_BYTES) {
    throw new Error("图片不能超过 5MB");
  }

  const body: FeedbackRequest = {
    feedback: input.feedback,
    biliId: input.biliId,
    appVersion: Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? null,
    image: input.image
      ? {
          filename: input.image.file.name,
          mimeType: input.image.mimeType,
          content: await input.image.file.base64(),
        }
      : undefined,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);
  try {
    const response = await fetch(`${serverUrl}/api/feedback`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    const parsed = FeedbackResponseSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) {
      throw new Error(`反馈提交失败（HTTP ${response.status}）`);
    }
    if (!response.ok || !parsed.data.success) {
      throw new Error(parsed.data.success ? `反馈提交失败（HTTP ${response.status}）` : parsed.data.error);
    }
    return parsed.data;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("反馈提交超时，请稍后重试");
    }
    throw error instanceof Error ? error : new Error("反馈提交失败，请稍后重试");
  } finally {
    clearTimeout(timeout);
  }
}

export function useSubmitFeedback() {
  const { trigger, isMutating } = useSWRMutation<
    { success: true },
    Error,
    typeof FEEDBACK_MUTATION_KEY,
    SubmitFeedbackInput
  >(FEEDBACK_MUTATION_KEY, (_key, { arg }) => submitFeedback(arg), { revalidate: false });

  return { submit: trigger, isSubmitting: isMutating };
}
