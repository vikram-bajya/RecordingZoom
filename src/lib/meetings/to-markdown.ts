import { platformLabel } from "./platforms";
import { formatDuration } from "@/lib/utils";
import type { MeetingSession } from "./types";

export function briefingMarkdown(session: MeetingSession): string {
  const brief = session.brief;
  const when = new Date(session.startedAt ?? session.createdAt).toLocaleString(
    undefined,
    { dateStyle: "medium", timeStyle: "short" },
  );
  const lines: string[] = [
    `# ${session.title}`,
    "",
    `${platformLabel(session.platform)} · ${formatDuration(session.durationMs)} · ${when}`,
  ];
  if (session.url) lines.push(session.url);
  lines.push("");

  if (brief) {
    lines.push("## Purpose of this meeting", "", brief.purpose, "");
    lines.push("## In short", "", brief.summary, "");
    if (brief.participants.length) {
      lines.push("## Who spoke", "", brief.participants.join(", "), "");
    }
    if (brief.topics.length) {
      lines.push("## Topics, explained", "");
      brief.topics.forEach((t, i) => {
        lines.push(`### ${i + 1}. ${t.title}`, "", t.explanation, "");
      });
    }
    if (brief.decisions.length) {
      lines.push("## Decisions", "");
      brief.decisions.forEach((d) => lines.push(`- ${d}`));
      lines.push("");
    }
    if (brief.actionItems.length) {
      lines.push("## Action items", "");
      brief.actionItems.forEach((item) => {
        const who = [item.owner, item.due].filter(Boolean).join(" · ");
        lines.push(`- ${item.task}${who ? ` (${who})` : ""}`);
      });
      lines.push("");
    }
    if (brief.quotes.length) {
      lines.push("## What was said", "");
      brief.quotes.forEach((q) => {
        lines.push(`> ${q.speaker ? `${q.speaker}: ` : ""}${q.text}`, "");
      });
    }
    if (brief.links.length) {
      lines.push("## Links mentioned", "");
      brief.links.forEach((l) => lines.push(`- ${l.context}: ${l.url}`));
      lines.push("");
    }
  }

  if (session.notes.trim()) {
    lines.push("## Listener notes", "", session.notes.trim(), "");
  }

  if (session.screenshots.length) {
    lines.push(
      "## Important screens",
      "",
      `${session.screenshots.length} frame(s) are attached in the PDF.`,
      "",
    );
  }

  lines.push("## Full transcript", "");
  if (session.segments.length) {
    session.segments.forEach((seg) => {
      const who = seg.speaker ? ` ${seg.speaker}` : "";
      lines.push(`[${formatDuration(seg.t)}]${who} ${seg.text}`);
    });
  } else {
    lines.push(session.transcriptText || "No speech was captured.");
  }
  return lines.join("\n");
}
