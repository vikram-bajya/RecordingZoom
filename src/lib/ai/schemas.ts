import { z } from "zod";

export const BriefSchema = z.object({
  purpose: z.string(),
  summary: z.string(),
  topics: z
    .array(
      z.object({
        title: z.string(),
        explanation: z.string(),
      }),
    )
    .default([]),
  decisions: z.array(z.string()).default([]),
  actionItems: z
    .array(
      z.object({
        task: z.string(),
        owner: z.string().optional(),
        due: z.string().optional(),
      }),
    )
    .default([]),
  links: z
    .array(
      z.object({
        url: z.string(),
        context: z.string(),
      }),
    )
    .default([]),
  quotes: z
    .array(
      z.object({
        text: z.string(),
        speaker: z.string().optional(),
      }),
    )
    .default([]),
  participants: z.array(z.string()).default([]),
  screenshotCaptions: z
    .array(
      z.object({
        index: z.number(),
        caption: z.string(),
      }),
    )
    .optional(),
});

export type AnalyzedBrief = z.infer<typeof BriefSchema>;

export const InputSchema = z.object({
  title: z.string(),
  platform: z.string(),
  url: z.string(),
  durationLabel: z.string(),
  transcript: z.string(),
  notes: z.string().optional(),
  screenshotCount: z.number().int().min(0).max(24),
  extraLinks: z.array(z.string()).optional(),
});
