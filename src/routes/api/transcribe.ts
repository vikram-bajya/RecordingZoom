import { createFileRoute } from "@tanstack/react-router";
import { NO_KEY_MESSAGE, extractJson, geminiText, getProvider } from "@/lib/ai/provider.server";

const MAX_BYTES = 24_000_000;

type Word = {
  text?: string;
  word?: string;
  start?: number;
  end?: number;
  speaker?: number;
};

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cfg = getProvider();
        if (!cfg) {
          return Response.json({ ok: false, error: NO_KEY_MESSAGE }, { status: 503 });
        }

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) {
          return Response.json(
            { ok: false, error: "No audio file received" },
            { status: 400 },
          );
        }
        if (file.size > MAX_BYTES) {
          return Response.json(
            {
              ok: false,
              error: "That clip is too large for a single pass. Debrief will split it.",
            },
            { status: 413 },
          );
        }

        const language = String(form.get("language") ?? "en").trim() || "en";

        if (cfg.provider === "gemini") {
          return transcribeWithGemini(cfg, file, language);
        }
        const apiKey = cfg.apiKey;
        const outbound = new FormData();
        outbound.append("model", "grok-voice-transcribe-2.0");
        outbound.append("format", "true");
        outbound.append("diarize", "true");
        outbound.append("language", language.slice(0, 8));
        outbound.append("file", file, file.name || "session.wav");

        const res = await fetch(`${cfg.baseUrl}/stt`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: outbound,
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return Response.json(
            {
              ok: false,
              error: `Transcription failed (${res.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`,
            },
            { status: 502 },
          );
        }

        const body = (await res.json()) as {
          text?: string;
          transcript?: string;
          duration?: number;
          words?: Word[];
        };

        const words = body.words ?? [];
        const segments: { t: number; speaker?: string; text: string }[] = [];
        let current:
          | { speaker?: number; t: number; words: string[] }
          | undefined;

        for (const w of words) {
          const token = (w.text ?? w.word ?? "").trim();
          if (!token) continue;
          const start = typeof w.start === "number" ? w.start : 0;
          if (!current || current.speaker !== w.speaker) {
            if (current && current.words.length) {
              segments.push({
                t: Math.round(current.t * 1000),
                speaker:
                  current.speaker !== undefined
                    ? `Speaker ${current.speaker + 1}`
                    : undefined,
                text: current.words.join(" "),
              });
            }
            current = { speaker: w.speaker, t: start, words: [token] };
          } else {
            current.words.push(token);
          }
        }
        if (current && current.words.length) {
          segments.push({
            t: Math.round(current.t * 1000),
            speaker:
              current.speaker !== undefined
                ? `Speaker ${current.speaker + 1}`
                : undefined,
            text: current.words.join(" "),
          });
        }

        const text = (body.text ?? body.transcript ?? "").trim();
        return Response.json({
          ok: true,
          text: text || segments.map((s) => s.text).join(" "),
          duration: body.duration ?? 0,
          segments,
        });
      },
    },
  },
});

async function transcribeWithGemini(
  cfg: NonNullable<ReturnType<typeof getProvider>>,
  file: File,
  language: string,
): Promise<Response> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = file.type && file.type.startsWith("audio/") ? file.type : "audio/wav";
  const prompt = `Transcribe this meeting audio word for word in its original language (language hint: ${language}). Do not summarize, translate, or invent words. If there is no speech, return an empty segments array.
If different people speak, label them "Speaker 1", "Speaker 2", and so on, consistently.
Return JSON only: {"segments":[{"start": <seconds from the start of this clip>, "speaker": "Speaker 1", "text": "..."}]}`;

  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/models/${cfg.sttModel}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: mime, data: bytes.toString("base64") } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch {
    return Response.json(
      { ok: false, error: "Could not reach the transcription service" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return Response.json(
      {
        ok: false,
        error: `Transcription failed (${res.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`,
      },
      { status: 502 },
    );
  }

  const raw = geminiText((await res.json()) as Parameters<typeof geminiText>[0]);
  let list: { start?: number; speaker?: string; text?: string }[] = [];
  try {
    const parsed = extractJson(raw) as { segments?: typeof list };
    list = Array.isArray(parsed.segments) ? parsed.segments : [];
  } catch {
    // The model answered in plain text; keep it as one segment.
    if (raw) list = [{ text: raw }];
  }

  const segments: { t: number; speaker?: string; text: string }[] = [];
  let last = 0;
  for (const item of list) {
    const text = String(item.text ?? "").trim();
    if (!text) continue;
    const start = typeof item.start === "number" && item.start >= last ? item.start : last;
    last = start;
    segments.push({
      t: Math.round(start * 1000),
      speaker: item.speaker ? String(item.speaker).slice(0, 40) : undefined,
      text,
    });
  }

  return Response.json({
    ok: true,
    text: segments.map((s) => s.text).join(" "),
    duration: 0,
    segments,
  });
}
