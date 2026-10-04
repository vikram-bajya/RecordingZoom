import {
  PDFArray,
  PDFDocument,
  PDFName,
  PDFString,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { formatDuration } from "@/lib/utils";
import { platformLabel } from "@/lib/meetings/platforms";
import type { MeetingSession } from "@/lib/meetings/types";

const PAGE = { w: 612, h: 792 };
const MARGIN = 54;
const INK = rgb(0.11, 0.105, 0.098);
const MUTED = rgb(0.43, 0.416, 0.388);
const RULE = rgb(0.886, 0.867, 0.827);
const BRAND = rgb(0.247, 0.325, 0.408);
const PAPER = rgb(0.957, 0.945, 0.918);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const raw = (text || "").replace(/\s+/g, " ").trim();
  if (!raw) return [];
  const words = raw.split(" ");
  const lines: string[] = [];
  let line = "";
  const pushLong = (token: string) => {
    let rest = token;
    while (rest.length) {
      let i = rest.length;
      while (i > 1 && font.widthOfTextAtSize(rest.slice(0, i), size) > maxWidth) {
        i -= 1;
      }
      lines.push(rest.slice(0, i));
      rest = rest.slice(i);
    }
  };
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        line = "";
        pushLong(word);
      } else {
        line = word;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; jpeg: boolean } | null {
  const m = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png));base64,(.+)$/i);
  if (!m?.[1] || !m[2]) return null;
  const jpeg = /jpe?g/i.test(m[1]);
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return { bytes, jpeg };
}

function safeFilename(title: string): string {
  const base =
    title
      .replace(/[^\w\s-]+/g, "")
      .trim()
      .replace(/\s+/g, "-") || "briefing";
  return `${base.slice(0, 60)}-debrief.pdf`;
}

function addUriLink(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  url: string,
) {
  try {
    const href = url.trim();
    if (!/^https?:\/\//i.test(href)) return;
    const annot = page.doc.context.register(
      page.doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [x, y, x + width, y + height],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(href) },
      }),
    );
    const existing = page.node.lookup(PDFName.of("Annots"), PDFArray);
    if (existing) {
      existing.push(annot);
    } else {
      page.node.set(PDFName.of("Annots"), page.doc.context.obj([annot]));
    }
  } catch {
    /* annotation is optional */
  }
}

/**
 * The built-in PDF fonts only draw Latin text. Anything else (Hindi, Arabic,
 * CJK, emoji, ₹…) would make pdf-lib throw and lose the whole PDF, so replace
 * it with "?" first. The full original text stays in the on-screen briefing
 * and the Markdown export.
 */
const REPLACEMENTS: Record<string, string> = {
  "₹": "Rs ",
  "\u00a0": " ",
  "\t": " ",
  "\u2192": "->",
  "\u2190": "<-",
  "\u2713": "v",
  "\u2022": "·",
};

function toLatin(input: string, flag: { lost: boolean }, ok: Set<number>): string {
  let out = "";
  let pendingLoss = false;
  for (const ch of input) {
    const cp = ch.codePointAt(0) ?? 0;
    const mapped = REPLACEMENTS[ch];
    if (mapped !== undefined) {
      out += mapped;
      pendingLoss = false;
    } else if (cp === 10 || cp === 13 || (cp >= 32 && ok.has(cp))) {
      out += ch;
      pendingLoss = false;
    } else if (cp === 0x200d || (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0x300 && cp <= 0x36f)) {
      // zero-width joiners, variation selectors, combining marks: drop silently
    } else {
      flag.lost = true;
      if (!pendingLoss) out += "?";
      pendingLoss = true;
    }
  }
  return out;
}

function latinSession(
  session: MeetingSession,
  flag: { lost: boolean },
  ok: Set<number>,
): MeetingSession {
  const skip = new Set(["dataUrl", "url", "id"]);
  const walk = (v: unknown, key?: string): unknown => {
    if (typeof v === "string") return key && skip.has(key) ? v : toLatin(v, flag, ok);
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    }
    return v;
  };
  return walk(session) as MeetingSession;
}

export async function buildBriefPdf(original: MeetingSession): Promise<Uint8Array> {
  const flag = { lost: false };
  const pdf = await PDFDocument.create();
  const times = await pdf.embedFont(StandardFonts.TimesRoman);
  const timesI = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const timesB = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const drawable = new Set<number>(times.getCharacterSet());
  for (const f of [timesI, timesB, helv, helvB]) {
    const own = new Set<number>(f.getCharacterSet());
    for (const cp of [...drawable]) if (!own.has(cp)) drawable.delete(cp);
  }
  const session = latinSession(original, flag, drawable);

  const brief = session.brief;
  const maxW = PAGE.w - MARGIN * 2;
  let page: PDFPage = pdf.addPage([PAGE.w, PAGE.h]);
  let y = PAGE.h - MARGIN;

  const stamp = (p: PDFPage, index: number) => {
    p.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE.w,
      height: 28,
      color: PAPER,
    });
    p.drawText("Debrief", {
      x: MARGIN,
      y: 11,
      size: 9,
      font: timesI,
      color: MUTED,
    });
    const label = String(index);
    p.drawText(label, {
      x: PAGE.w - MARGIN - helv.widthOfTextAtSize(label, 9),
      y: 11,
      size: 9,
      font: helv,
      color: MUTED,
    });
  };

  const newPage = () => {
    stamp(page, pdf.getPageCount());
    page = pdf.addPage([PAGE.w, PAGE.h]);
    y = PAGE.h - MARGIN;
  };

  const need = (h: number) => {
    if (y - h < 44) newPage();
  };

  const rule = () => {
    need(16);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE.w - MARGIN, y },
      thickness: 0.6,
      color: RULE,
    });
    y -= 16;
  };

  const heading = (label: string) => {
    need(36);
    y -= 8;
    page.drawText(label.toUpperCase(), {
      x: MARGIN,
      y,
      size: 9,
      font: helvB,
      color: BRAND,
    });
    y -= 18;
  };

  const para = (text: string, font: PDFFont, size: number, leading: number, color = INK) => {
    const lines = wrap(text, font, size, maxW);
    for (const line of lines) {
      need(leading);
      page.drawText(line, { x: MARGIN, y, size, font, color });
      y -= leading;
    }
  };

  const linkPara = (url: string) => {
    const lines = wrap(url, helv, 9, maxW);
    for (const line of lines) {
      need(12);
      page.drawText(line, { x: MARGIN, y, size: 9, font: helv, color: BRAND });
      const w = Math.min(maxW, helv.widthOfTextAtSize(line, 9) + 4);
      addUriLink(page, MARGIN - 1, y - 2, w, 12, url);
      y -= 12;
    }
  };

  page.drawRectangle({
    x: 0,
    y: PAGE.h - 168,
    width: PAGE.w,
    height: 168,
    color: PAPER,
  });
  page.drawRectangle({
    x: 0,
    y: PAGE.h - 168,
    width: 8,
    height: 168,
    color: BRAND,
  });
  page.drawText("SESSION BRIEFING", {
    x: MARGIN,
    y: PAGE.h - 56,
    size: 10,
    font: helvB,
    color: BRAND,
  });

  const titleLines = wrap(session.title || "Untitled session", timesB, 26, maxW);
  let ty = PAGE.h - 92;
  for (const line of titleLines.slice(0, 3)) {
    page.drawText(line, { x: MARGIN, y: ty, size: 26, font: timesB, color: INK });
    ty -= 30;
  }
  y = PAGE.h - 188;

  const when = new Date(session.startedAt ?? session.createdAt).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  para(
    `${platformLabel(session.platform)}  ·  ${formatDuration(session.durationMs)}  ·  ${when}`,
    helv,
    10,
    14,
    MUTED,
  );
  if (session.url) {
    y -= 4;
    linkPara(session.url);
  }
  y -= 8;
  rule();

  const contents: string[] = [];
  if (brief) {
    contents.push("Purpose of this meeting", "In short");
    if (brief.topics.length) contents.push("Topics, explained");
    if (brief.decisions.length) contents.push("Decisions");
    if (brief.actionItems.length) contents.push("Action items");
    if (brief.quotes.length) contents.push("What was said");
    if (brief.links.length) contents.push("Links mentioned");
  }
  if (session.notes.trim()) contents.push("Listener notes");
  if (session.screenshots.length) contents.push("Important screens");
  contents.push("Full transcript");

  heading("What’s in this PDF");
  para(
    "Read the purpose first. If the meeting matters, keep going — every topic, decision, screenshot, spoken link, and the full transcript is here.",
    timesI,
    10,
    13,
    MUTED,
  );
  y -= 4;
  para(contents.join("   ·   "), helv, 10, 14, MUTED);
  y -= 4;

  if (brief) {
    heading("Purpose of this meeting");
    para(brief.purpose, times, 12, 16);
    y -= 8;
    heading("In short");
    para(brief.summary, times, 12, 16);
    y -= 4;

    if (brief.participants.length) {
      heading("Who spoke");
      para(brief.participants.join("   ·   "), helv, 10, 14, MUTED);
    }

    if (brief.topics.length) {
      heading("Topics, explained");
      brief.topics.forEach((topic, i) => {
        need(48);
        const n = `${i + 1}.`;
        page.drawText(n, { x: MARGIN, y, size: 12, font: timesB, color: BRAND });
        const titleWrap = wrap(topic.title, timesB, 13, maxW - 24);
        for (const line of titleWrap) {
          need(16);
          page.drawText(line, {
            x: MARGIN + 22,
            y,
            size: 13,
            font: timesB,
            color: INK,
          });
          y -= 16;
        }
        y -= 2;
        para(topic.explanation, times, 11, 15);
        y -= 10;
      });
    }

    if (brief.decisions.length) {
      heading("Decisions");
      for (const d of brief.decisions) {
        need(18);
        page.drawText("·", { x: MARGIN, y, size: 12, font: timesB, color: BRAND });
        const lines = wrap(d, times, 11, maxW - 16);
        for (const line of lines) {
          need(15);
          page.drawText(line, { x: MARGIN + 14, y, size: 11, font: times, color: INK });
          y -= 15;
        }
        y -= 4;
      }
    }

    if (brief.actionItems.length) {
      heading("Action items");
      for (const item of brief.actionItems) {
        const who = [item.owner, item.due].filter(Boolean).join(" · ");
        need(20);
        if (who) {
          page.drawText(who, { x: MARGIN, y, size: 9, font: helvB, color: BRAND });
          y -= 13;
        }
        para(item.task, times, 11, 15);
        y -= 6;
      }
    }

    if (brief.quotes.length) {
      heading("What was said");
      for (const q of brief.quotes) {
        if (q.speaker) {
          need(14);
          page.drawText(q.speaker, { x: MARGIN, y, size: 9, font: helvB, color: BRAND });
          y -= 13;
        }
        para(`“${q.text}”`, timesI, 11, 15);
        y -= 8;
      }
    }

    if (brief.links.length) {
      heading("Links mentioned");
      for (const link of brief.links) {
        need(28);
        para(link.context, timesI, 10, 13, MUTED);
        linkPara(link.url);
        y -= 6;
      }
    }
  }

  if (session.notes.trim()) {
    heading("Listener notes");
    para(session.notes.trim(), times, 11, 15);
    y -= 6;
  }

  if (session.screenshots.length) {
    heading("Important screens");
    para(
      "Frames captured when the shared meeting screen changed, pinned on purpose, or attached after the call.",
      timesI,
      10,
      13,
      MUTED,
    );
    y -= 8;

    for (let i = 0; i < session.screenshots.length; i += 1) {
      const shot = session.screenshots[i]!;
      const parsed = dataUrlToBytes(shot.dataUrl);
      if (!parsed) continue;
      try {
        const img = parsed.jpeg
          ? await pdf.embedJpg(parsed.bytes)
          : await pdf.embedPng(parsed.bytes);
        const maxH = 280;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        need(h + 36);
        const t = formatDuration(shot.t);
        page.drawText(`${t}${shot.caption ? "  —  " + shot.caption : ""}`.slice(0, 110), {
          x: MARGIN,
          y,
          size: 9,
          font: helv,
          color: MUTED,
        });
        y -= 12;
        page.drawImage(img, { x: MARGIN, y: y - h, width: w, height: h });
        y -= h + 18;
      } catch {
        /* skip a bad frame */
      }
    }
  }

  heading("Full transcript");
  para(
    flag.lost
      ? "Everything that was heard, in order. Characters this PDF cannot draw (for example Hindi or emoji) show as ?. The complete original text is in the on-screen briefing and the Markdown export."
      : "Everything that was heard during the session, in order.",
    timesI,
    10,
    13,
    MUTED,
  );
  y -= 8;

  if (session.segments.length) {
    for (const seg of session.segments) {
      const stampT = formatDuration(seg.t);
      const speaker = seg.speaker ? `${seg.speaker}  ` : "";
      need(28);
      page.drawText(`${stampT}  ${speaker}`.trim(), {
        x: MARGIN,
        y,
        size: 8,
        font: helvB,
        color: BRAND,
      });
      y -= 12;
      para(seg.text, times, 10, 13);
      y -= 6;
    }
  } else if (session.transcriptText.trim()) {
    para(session.transcriptText, times, 10, 13);
  } else {
    para("No speech was captured in this session.", timesI, 11, 14, MUTED);
  }

  stamp(page, pdf.getPageCount());
  pdf.setTitle(`${session.title} — Debrief`);
  pdf.setAuthor("Debrief");
  pdf.setSubject("Meeting briefing: purpose, topics, screenshots, links, and full transcript");
  pdf.setKeywords(["meeting", "briefing", "transcript", platformLabel(session.platform)]);
  pdf.setProducer("Debrief");
  pdf.setCreationDate(new Date(session.startedAt ?? session.createdAt));
  return pdf.save();
}

export async function briefPdfBlob(session: MeetingSession): Promise<Blob> {
  const bytes = await buildBriefPdf(session);
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function downloadBriefPdf(session: MeetingSession): Promise<void> {
  const blob = await briefPdfBlob(session);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename(session.title);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function openBriefPdf(session: MeetingSession): Promise<string> {
  const blob = await briefPdfBlob(session);
  return URL.createObjectURL(blob);
}
