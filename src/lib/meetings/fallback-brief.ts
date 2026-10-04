import { extractUrls } from "./links";
import type { BriefQuote, MeetingBrief, TranscriptSegment } from "./types";

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);
}

function looksLikeAction(line: string): boolean {
  return (
    /\b(will|let's|lets|please|action|todo|follow[- ]up|i'll|we'll|can you|need to)\b/i.test(
      line,
    ) && line.length > 24
  );
}

function extractParticipants(segments: TranscriptSegment[], text: string): string[] {
  const names = new Set<string>();
  for (const seg of segments) {
    if (seg.speaker && seg.speaker.length < 24) names.add(seg.speaker);
  }
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z][a-zA-Z]{1,18}):\s/);
    if (m?.[1]) names.add(m[1]);
  }
  return [...names].slice(0, 12);
}

function extractQuotes(bits: string[], segments: TranscriptSegment[]): BriefQuote[] {
  const fromSegs = segments
    .filter((s) => s.text.length > 70 && s.text.length < 240)
    .slice(0, 4)
    .map((s) => ({ text: s.text, speaker: s.speaker }));
  if (fromSegs.length) return fromSegs;
  return bits
    .filter((s) => s.length > 70 && s.length < 240)
    .slice(0, 4)
    .map((text) => ({ text }));
}

export function buildFallbackBrief(input: {
  title: string;
  transcript: string;
  segments: TranscriptSegment[];
  extraLinks?: string[];
}): MeetingBrief {
  const text = input.transcript.trim();
  const bits = sentences(text);
  const purpose =
    bits[0] ??
    `This session covered ${input.title || "the scheduled meeting"}, based on the captured conversation.`;

  const chunks: string[] = [];
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 80);
  const source = paras.length >= 3 ? paras : bits;
  for (let i = 0; i < source.length && chunks.length < 6; i += 1) {
    const block = source[i] ?? "";
    if (block.length > 60) chunks.push(block);
  }

  const topics = chunks.slice(0, 6).map((block, i) => {
    const first = block.split(/(?<=[.!?])\s+/)[0] ?? block;
    const title =
      first.length > 72 ? `${first.slice(0, 68).trim()}…` : first.replace(/:$/, "");
    return {
      title: title || `Topic ${i + 1}`,
      explanation: block.length > 520 ? `${block.slice(0, 516).trim()}…` : block,
    };
  });

  const actionItems = text
    .split("\n")
    .map((l) => l.trim())
    .filter(looksLikeAction)
    .slice(0, 8)
    .map((line) => {
      const m = line.match(/^([A-Z][a-z]+):?\s+(.*)$/);
      if (m?.[1] && m[2]) return { owner: m[1], task: m[2] };
      return { task: line.replace(/^[A-Z][a-z]+:\s*/, "") };
    });

  const decisions = bits
    .filter((s) =>
      /\b(decided|agree|lock|commit|we will|going with|approved)\b/i.test(s),
    )
    .slice(0, 6);

  const urls = [...new Set([...extractUrls(text), ...(input.extraLinks ?? [])])];

  return {
    purpose,
    summary:
      bits.slice(0, 3).join(" ") ||
      "A full transcript is included below. Topics were grouped from the captured audio.",
    topics:
      topics.length > 0
        ? topics
        : [
            {
              title: input.title || "Session notes",
              explanation:
                text.slice(0, 500) || "No speech was captured in this session.",
            },
          ],
    decisions,
    actionItems,
    links: urls.map((url) => ({ url, context: "Mentioned in the session" })),
    quotes: extractQuotes(bits, input.segments),
    participants: extractParticipants(input.segments, text),
  };
}
