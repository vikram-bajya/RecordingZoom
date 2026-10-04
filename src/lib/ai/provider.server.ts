/**
 * Which AI service transcribes audio and writes the briefing.
 *
 * Set ONE of these in `.env`:
 *   GEMINI_API_KEY=...   (free tier available at https://aistudio.google.com/apikey)
 *   XAI_API_KEY=...      (the original Grok / xAI service)
 *
 * AI_PROVIDER=gemini|xai forces a choice when both keys are present.
 * Base URLs can be overridden (AI_BASE_URL_GEMINI / AI_BASE_URL_XAI) for testing.
 */
export type Provider = "gemini" | "xai";

export type ProviderConfig = {
  provider: Provider;
  apiKey: string;
  baseUrl: string;
  textModel: string;
  sttModel: string;
};

function clean(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

export function getProvider(): ProviderConfig | null {
  const gemini = clean("GEMINI_API_KEY") ?? clean("GOOGLE_API_KEY");
  const xai = clean("XAI_API_KEY");
  const forced = clean("AI_PROVIDER")?.toLowerCase();

  const useGemini =
    forced === "gemini" ? Boolean(gemini) : forced === "xai" ? false : Boolean(gemini);
  if (useGemini && gemini) {
    const model = clean("GEMINI_MODEL") ?? "gemini-2.5-flash";
    return {
      provider: "gemini",
      apiKey: gemini,
      baseUrl: clean("AI_BASE_URL_GEMINI") ?? "https://generativelanguage.googleapis.com/v1beta",
      textModel: model,
      sttModel: model,
    };
  }
  if (xai) {
    return {
      provider: "xai",
      apiKey: xai,
      baseUrl: clean("AI_BASE_URL_XAI") ?? "https://api.x.ai/v1",
      textModel: clean("XAI_TEXT_MODEL") ?? "grok-4.5",
      sttModel: "grok-voice-transcribe-2.0",
    };
  }
  return null;
}

export const NO_KEY_MESSAGE =
  "No AI key found. Add GEMINI_API_KEY (or XAI_API_KEY) to the .env file and restart.";

/** Models sometimes send null for optional fields; schemas expect them absent. */
export function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === null || v === undefined) continue;
      out[k] = stripNulls(v);
    }
    return out;
  }
  return value;
}

/** Pull the first JSON object out of a model reply, tolerating ``` fences. */
export function extractJson(raw: string): unknown {
  return stripNulls(extractJsonRaw(raw));
}

function extractJsonRaw(raw: string): unknown {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }
  const fenced = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(fenced);
  } catch {
    const start = fenced.indexOf("{");
    const end = fenced.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(fenced.slice(start, end + 1));
    throw new Error("No JSON in reply");
  }
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

export function geminiText(body: GeminiResponse): string {
  return (body.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}
