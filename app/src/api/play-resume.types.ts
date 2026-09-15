import type { z } from "zod";

import type { PlayResumeInfoSchema } from "./play-resume.schema";

export type PlayResumeInfo = z.infer<typeof PlayResumeInfoSchema>;
