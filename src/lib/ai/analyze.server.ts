import { z } from "zod";
import { NO_KEY_MESSAGE, extractJson, geminiText, getProvider } from "./provider.server";
import { BriefSchema, type InputSchema } from "./schemas";

export async function runAnalysis(data: z.infer<typeof InputSchema>) {
  const cfg = getProvider();
  if (!cfg) {
    return { ok: false as const, error: NO_KEY_MESSAGE };
  }

  const transcript = data.transcript.slice(0, 48_000);
  if (transcript.trim().length < 20) {
    return { ok: false as const, error: "Transcript is too short to analyze" };
  }

  const extra =
    data.extraLinks && data.extraLinks.length > 0
      ? `\nKnown URLs: ${data.extraLinks.join(", ")}`
      : "";
  const notes = data.notes?.trim()
    ? `\nListener notes (treat as hints, not facts unless the transcript agrees):\n${data.notes.trim().slice(0, 4000)}`
    : "";

  const prompt = `You are writing a complete meeting briefing from a captured session. Someone who missed the call should understand the purpose and every topic after reading this. The first section they will read is "purpose" — write it so they can decide in thirty seconds whether the rest is worth reading.

Meeting title: ${data.title}
Platform: ${data.platform}
Link: ${data.url}
Duration: ${data.durationLabel}
Screenshots captured: ${data.screenshotCount}
${extra}
${notes}

Transcript:
"""
${transcript}
"""

Return a JSON object with:
- purpose: 1-3 sentences on why this meeting happened
- summary: a tight paragraph of what was covered
- topics: array of {title, explanation}. Each explanation must teach the idea in plain language so someone who missed the call understands it. 4-10 topics covering everything that was actually discussed. Do not skip a subject because it felt minor.
- decisions: array of strings
- actionItems: array of {task, owner?, due?}
- links: every URL mentioned, including ones spoken as domain names (for example "docs.atlas.dev" or "github.com/org/repo"). Each {url, context}. Prefer https:// URLs.
- quotes: 2-5 short verbatim lines that carry a decision or a strong point, {text, speaker?}
- participants: names if they are spoken or labeled in the transcript
- screenshotCaptions: if screenshots > 0, array of {index (0-based), caption} guessing what each timed capture likely showed from the nearby dialogue

Write every field in English, even if the meeting was held in another language (keep names, and keep quoted lines as they were spoken).\n\nBe faithful to the transcript. Do not invent attendees, dates, or URLs. If something is unclear, say so briefly.`;

  const system = "You produce structured meeting briefings as JSON only. No markdown.";
  let raw = "";

  try {
    if (cfg.provider === "gemini") {
      const res = await fetch(`${cfg.baseUrl}/models/${cfg.textModel}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      });
      if (!res.ok) {
        return { ok: false as const, error: `Gemini API error ${res.status}` };
      }
      raw = geminiText((await res.json()) as Parameters<typeof geminiText>[0]);
    } else {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.textModel,
          temperature: 0.3,
          max_tokens: 4500,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) {
        return { ok: false as const, error: `xAI API error ${res.status}` };
      }
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      raw = body.choices?.[0]?.message?.content ?? "";
    }
  } catch {
    return { ok: false as const, error: "Could not reach the AI service" };
  }

  try {
    const parsed = BriefSchema.parse(extractJson(raw));
    return { ok: true as const, brief: parsed };
  } catch {
    return { ok: false as const, error: "Could not parse the briefing" };
  }
}
