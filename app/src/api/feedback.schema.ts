import { z } from "zod";

export const FeedbackResponseSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true) }),
  z.object({ success: z.literal(false), error: z.string().min(1) }),
]);
