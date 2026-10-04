import { createServerFn } from "@tanstack/react-start";
import { InputSchema } from "./schemas";
import { runAnalysis } from "./analyze.server";

export type { AnalyzedBrief } from "./schemas";

export const analyzeMeeting = createServerFn({ method: "POST" })
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => runAnalysis(data));
