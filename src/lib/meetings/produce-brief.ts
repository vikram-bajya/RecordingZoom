import { analyzeMeeting } from "@/lib/ai/analyze";
import { prepareAudioForStt, splitAudioFile } from "@/lib/capture/wav";
import { extractUrls } from "./links";
import { buildFallbackBrief } from "./fallback-brief";
import { platformLabel } from "./platforms";
import { formatDuration } from "@/lib/utils";
import type { MeetingBrief, MeetingSession, TranscriptSegment } from "./types";

const SINGLE_PASS_BYTES = 12_000_000;

export type SttResult = {
  ok: boolean;
  text?: string;
  segments?: TranscriptSegment[];
  durationMs?: number;
  error?: string;
};

function mergeLinks(brief: MeetingBrief, transcript: string): MeetingBrief {
  const have = new Set(brief.links.map((l) => l.url));
  const extras = extractUrls(transcript).filter((u) => !have.has(u));
  if (extras.length === 0) return brief;
  return {
    ...brief,
    links: [
      ...brief.links,
      ...extras.map((url) => ({ url, context: "Mentioned in the session" })),
    ],
  };
}

async function transcribeOnce(
  file: Blob,
  language: string,
): Promise<{
  ok: boolean;
  text?: string;
  segments?: { t: number; speaker?: string; text: string }[];
  duration?: number;
  error?: string;
}> {
  const prepared = await prepareAudioForStt(file);
  const form = new FormData();
  form.append("language", language.slice(0, 8) || "en");
  form.append("file", prepared, prepared.name || "session.wav");
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  const body = (await res.json()) as {
    ok?: boolean;
    text?: string;
    duration?: number;
    segments?: { t: number; speaker?: string; text: string }[];
    error?: string;
  };
  if (!res.ok || !body.ok) {
    return { ok: false, error: body.error ?? "Transcription failed" };
  }
  return {
    ok: true,
    text: body.text,
    duration: body.duration,
    segments: body.segments,
  };
}

function offsetSegments(
  segments: { t: number; speaker?: string; text: string }[] | undefined,
  offsetMs: number,
  prefix: string,
): TranscriptSegment[] {
  return (segments ?? []).map((s, i) => ({
    id: `${prefix}-${i}`,
    t: s.t + offsetMs,
    speaker: s.speaker,
    text: s.text,
  }));
}

export async function transcribeFile(
  file: Blob,
  language: string,
  offsetMs = 0,
  onProgress?: (label: string, value: number) => void,
): Promise<SttResult> {
  const trySplit = file.size > SINGLE_PASS_BYTES;

  if (!trySplit) {
    onProgress?.("Transcribing audio", 42);
    const stt = await transcribeOnce(file, language);
    if (stt.ok) {
      return {
        ok: true,
        text: stt.text,
        durationMs: Math.round((stt.duration ?? 0) * 1000),
        segments: offsetSegments(stt.segments, offsetMs, `stt-${offsetMs}`),
      };
    }
    if (file.size <= 4_000_000) {
      return { ok: false, error: stt.error ?? "Transcription failed" };
    }
  }

  onProgress?.("Splitting the recording", 28);
  const slices = await splitAudioFile(file, 90);
  if (!slices || slices.length === 0) {
    if (file.size <= SINGLE_PASS_BYTES) {
      const stt = await transcribeOnce(file, language);
      if (stt.ok) {
        return {
          ok: true,
          text: stt.text,
          durationMs: Math.round((stt.duration ?? 0) * 1000),
          segments: offsetSegments(stt.segments, offsetMs, `stt-${offsetMs}`),
        };
      }
      return { ok: false, error: stt.error ?? "Could not transcribe that file." };
    }
    return {
      ok: false,
      error:
        "That recording is too large to transcribe in one pass. Use live listening, or a shorter clip.",
    };
  }

  const texts: string[] = [];
  const segments: TranscriptSegment[] = [];
  let durationMs = 0;
  for (let i = 0; i < slices.length; i += 1) {
    const slice = slices[i]!;
    onProgress?.(
      `Transcribing part ${i + 1} of ${slices.length}`,
      30 + Math.round((i / slices.length) * 40),
    );
    const stt = await transcribeOnce(slice.blob, language);
    if (!stt.ok || !stt.text) {
      if (texts.length === 0) {
        return { ok: false, error: stt.error ?? "Transcription failed" };
      }
      continue;
    }
    texts.push(stt.text);
    segments.push(
      ...offsetSegments(stt.segments, offsetMs + slice.offsetMs, `stt-${i}`),
    );
    durationMs = offsetMs + slice.offsetMs + slice.durationMs;
  }

  if (texts.length === 0) {
    return { ok: false, error: "Transcription failed" };
  }

  return {
    ok: true,
    text: texts.join(" ").trim(),
    segments,
    durationMs,
  };
}

export async function produceBrief(
  session: MeetingSession,
): Promise<{ brief: MeetingBrief; captions: Record<number, string> }> {
  const captions: Record<number, string> = {};
  let brief: MeetingBrief | undefined;

  try {
    const result = await analyzeMeeting({
      data: {
        title: session.title,
        platform: platformLabel(session.platform),
        url: session.url,
        durationLabel: formatDuration(session.durationMs),
        transcript: session.transcriptText,
        notes: session.notes,
        screenshotCount: Math.min(session.screenshots.length, 24),
        extraLinks: extractUrls(`${session.transcriptText}\n${session.notes}`),
      },
    });
    if (result.ok) {
      brief = {
        purpose: result.brief.purpose,
        summary: result.brief.summary,
        topics: result.brief.topics,
        decisions: result.brief.decisions,
        actionItems: result.brief.actionItems,
        links: result.brief.links,
        quotes: result.brief.quotes ?? [],
        participants: result.brief.participants ?? [],
      };
      for (const c of result.brief.screenshotCaptions ?? []) {
        captions[c.index] = c.caption;
      }
    }
  } catch {
    /* fall through */
  }

  if (!brief) {
    brief = buildFallbackBrief({
      title: session.title,
      transcript: session.transcriptText,
      segments: session.segments,
    });
  }

  return {
    brief: mergeLinks(brief, `${session.transcriptText}\n${session.notes}`),
    captions,
  };
}
