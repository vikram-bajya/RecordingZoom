import { i as __toESM } from "./_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "./_libs/@radix-ui/react-collection+[...].mjs";
import { b as useNavigate, y as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { a as RefreshCw, d as FileText, g as Copy, h as Download, p as Eye, r as Trash2, t as X, u as ImagePlus, y as ArrowLeft } from "./_libs/lucide-react.mjs";
import { r as Route$1 } from "./_ssr/router-BEOUVpOq.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { _ as useSession, g as saveSession, h as removeSession, l as formatDuration, m as platformLabel, n as Badge, o as cn, r as Button, t as AppShell } from "./_ssr/use-sessions-DQZyv5Hb.mjs";
import { n as fileToJpegDataUrl, o as produceBrief } from "./_ssr/produce-brief-Bet0Zz6O.mjs";
import { t as Input } from "./_ssr/input-BMyqbHsS.mjs";
import { t as Root } from "./_libs/radix-ui__react-separator.mjs";
import { a as PDFName, i as PDFString, n as StandardFonts, o as PDFArray, r as rgb, t as PDFDocument } from "./_libs/pdf-lib.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_id-DpGY6eRH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Separator = import_react.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	decorative,
	orientation,
	className: cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className),
	...props
}));
Separator.displayName = Root.displayName;
function briefingMarkdown(session) {
	const brief = session.brief;
	const when = new Date(session.startedAt ?? session.createdAt).toLocaleString(void 0, {
		dateStyle: "medium",
		timeStyle: "short"
	});
	const lines = [
		`# ${session.title}`,
		"",
		`${platformLabel(session.platform)} · ${formatDuration(session.durationMs)} · ${when}`
	];
	if (session.url) lines.push(session.url);
	lines.push("");
	if (brief) {
		lines.push("## Purpose of this meeting", "", brief.purpose, "");
		lines.push("## In short", "", brief.summary, "");
		if (brief.participants.length) lines.push("## Who spoke", "", brief.participants.join(", "), "");
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
	if (session.notes.trim()) lines.push("## Listener notes", "", session.notes.trim(), "");
	if (session.screenshots.length) lines.push("## Important screens", "", `${session.screenshots.length} frame(s) are attached in the PDF.`, "");
	lines.push("## Full transcript", "");
	if (session.segments.length) session.segments.forEach((seg) => {
		const who = seg.speaker ? ` ${seg.speaker}` : "";
		lines.push(`[${formatDuration(seg.t)}]${who} ${seg.text}`);
	});
	else lines.push(session.transcriptText || "No speech was captured.");
	return lines.join("\n");
}
var PAGE = {
	w: 612,
	h: 792
};
var MARGIN = 54;
var INK = rgb(.11, .105, .098);
var MUTED = rgb(.43, .416, .388);
var RULE = rgb(.886, .867, .827);
var BRAND = rgb(.247, .325, .408);
var PAPER = rgb(.957, .945, .918);
function wrap(text, font, size, maxWidth) {
	const raw = (text || "").replace(/\s+/g, " ").trim();
	if (!raw) return [];
	const words = raw.split(" ");
	const lines = [];
	let line = "";
	const pushLong = (token) => {
		let rest = token;
		while (rest.length) {
			let i = rest.length;
			while (i > 1 && font.widthOfTextAtSize(rest.slice(0, i), size) > maxWidth) i -= 1;
			lines.push(rest.slice(0, i));
			rest = rest.slice(i);
		}
	};
	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
		else {
			if (line) lines.push(line);
			if (font.widthOfTextAtSize(word, size) > maxWidth) {
				line = "";
				pushLong(word);
			} else line = word;
		}
	}
	if (line) lines.push(line);
	return lines;
}
function dataUrlToBytes(dataUrl) {
	const m = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png));base64,(.+)$/i);
	if (!m?.[1] || !m[2]) return null;
	const jpeg = /jpe?g/i.test(m[1]);
	const bin = atob(m[2]);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
	return {
		bytes,
		jpeg
	};
}
function safeFilename(title) {
	return `${(title.replace(/[^\w\s-]+/g, "").trim().replace(/\s+/g, "-") || "briefing").slice(0, 60)}-debrief.pdf`;
}
function addUriLink(page, x, y, width, height, url) {
	try {
		const href = url.trim();
		if (!/^https?:\/\//i.test(href)) return;
		const annot = page.doc.context.register(page.doc.context.obj({
			Type: "Annot",
			Subtype: "Link",
			Rect: [
				x,
				y,
				x + width,
				y + height
			],
			Border: [
				0,
				0,
				0
			],
			A: {
				Type: "Action",
				S: "URI",
				URI: PDFString.of(href)
			}
		}));
		const existing = page.node.lookup(PDFName.of("Annots"), PDFArray);
		if (existing) existing.push(annot);
		else page.node.set(PDFName.of("Annots"), page.doc.context.obj([annot]));
	} catch {}
}
/**
* The built-in PDF fonts only draw Latin text. Anything else (Hindi, Arabic,
* CJK, emoji, ₹…) would make pdf-lib throw and lose the whole PDF, so replace
* it with "?" first. The full original text stays in the on-screen briefing
* and the Markdown export.
*/
var REPLACEMENTS = {
	"₹": "Rs ",
	"\xA0": " ",
	"	": " ",
	"→": "->",
	"←": "<-",
	"✓": "v",
	"•": "·"
};
function toLatin(input, flag, ok) {
	let out = "";
	let pendingLoss = false;
	for (const ch of input) {
		const cp = ch.codePointAt(0) ?? 0;
		const mapped = REPLACEMENTS[ch];
		if (mapped !== void 0) {
			out += mapped;
			pendingLoss = false;
		} else if (cp === 10 || cp === 13 || cp >= 32 && ok.has(cp)) {
			out += ch;
			pendingLoss = false;
		} else if (cp === 8205 || cp >= 65024 && cp <= 65039 || cp >= 768 && cp <= 879) {} else {
			flag.lost = true;
			if (!pendingLoss) out += "?";
			pendingLoss = true;
		}
	}
	return out;
}
function latinSession(session, flag, ok) {
	const skip = /* @__PURE__ */ new Set([
		"dataUrl",
		"url",
		"id"
	]);
	const walk = (v, key) => {
		if (typeof v === "string") return key && skip.has(key) ? v : toLatin(v, flag, ok);
		if (Array.isArray(v)) return v.map((x) => walk(x));
		if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
		return v;
	};
	return walk(session);
}
async function buildBriefPdf(original) {
	const flag = { lost: false };
	const pdf = await PDFDocument.create();
	const times = await pdf.embedFont(StandardFonts.TimesRoman);
	const timesI = await pdf.embedFont(StandardFonts.TimesRomanItalic);
	const timesB = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const helv = await pdf.embedFont(StandardFonts.Helvetica);
	const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);
	const drawable = new Set(times.getCharacterSet());
	for (const f of [
		timesI,
		timesB,
		helv,
		helvB
	]) {
		const own = new Set(f.getCharacterSet());
		for (const cp of [...drawable]) if (!own.has(cp)) drawable.delete(cp);
	}
	const session = latinSession(original, flag, drawable);
	const brief = session.brief;
	const maxW = PAGE.w - 108;
	let page = pdf.addPage([PAGE.w, PAGE.h]);
	let y = PAGE.h - MARGIN;
	const stamp = (p, index) => {
		p.drawRectangle({
			x: 0,
			y: 0,
			width: PAGE.w,
			height: 28,
			color: PAPER
		});
		p.drawText("Debrief", {
			x: MARGIN,
			y: 11,
			size: 9,
			font: timesI,
			color: MUTED
		});
		const label = String(index);
		p.drawText(label, {
			x: PAGE.w - MARGIN - helv.widthOfTextAtSize(label, 9),
			y: 11,
			size: 9,
			font: helv,
			color: MUTED
		});
	};
	const newPage = () => {
		stamp(page, pdf.getPageCount());
		page = pdf.addPage([PAGE.w, PAGE.h]);
		y = PAGE.h - MARGIN;
	};
	const need = (h) => {
		if (y - h < 44) newPage();
	};
	const rule = () => {
		need(16);
		page.drawLine({
			start: {
				x: MARGIN,
				y
			},
			end: {
				x: PAGE.w - MARGIN,
				y
			},
			thickness: .6,
			color: RULE
		});
		y -= 16;
	};
	const heading = (label) => {
		need(36);
		y -= 8;
		page.drawText(label.toUpperCase(), {
			x: MARGIN,
			y,
			size: 9,
			font: helvB,
			color: BRAND
		});
		y -= 18;
	};
	const para = (text, font, size, leading, color = INK) => {
		const lines = wrap(text, font, size, maxW);
		for (const line of lines) {
			need(leading);
			page.drawText(line, {
				x: MARGIN,
				y,
				size,
				font,
				color
			});
			y -= leading;
		}
	};
	const linkPara = (url) => {
		const lines = wrap(url, helv, 9, maxW);
		for (const line of lines) {
			need(12);
			page.drawText(line, {
				x: MARGIN,
				y,
				size: 9,
				font: helv,
				color: BRAND
			});
			const w = Math.min(maxW, helv.widthOfTextAtSize(line, 9) + 4);
			addUriLink(page, 53, y - 2, w, 12, url);
			y -= 12;
		}
	};
	page.drawRectangle({
		x: 0,
		y: PAGE.h - 168,
		width: PAGE.w,
		height: 168,
		color: PAPER
	});
	page.drawRectangle({
		x: 0,
		y: PAGE.h - 168,
		width: 8,
		height: 168,
		color: BRAND
	});
	page.drawText("SESSION BRIEFING", {
		x: MARGIN,
		y: PAGE.h - 56,
		size: 10,
		font: helvB,
		color: BRAND
	});
	const titleLines = wrap(session.title || "Untitled session", timesB, 26, maxW);
	let ty = PAGE.h - 92;
	for (const line of titleLines.slice(0, 3)) {
		page.drawText(line, {
			x: MARGIN,
			y: ty,
			size: 26,
			font: timesB,
			color: INK
		});
		ty -= 30;
	}
	y = PAGE.h - 188;
	const when = new Date(session.startedAt ?? session.createdAt).toLocaleString(void 0, {
		dateStyle: "long",
		timeStyle: "short"
	});
	para(`${platformLabel(session.platform)}  ·  ${formatDuration(session.durationMs)}  ·  ${when}`, helv, 10, 14, MUTED);
	if (session.url) {
		y -= 4;
		linkPara(session.url);
	}
	y -= 8;
	rule();
	const contents = [];
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
	para("Read the purpose first. If the meeting matters, keep going — every topic, decision, screenshot, spoken link, and the full transcript is here.", timesI, 10, 13, MUTED);
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
				page.drawText(n, {
					x: MARGIN,
					y,
					size: 12,
					font: timesB,
					color: BRAND
				});
				const titleWrap = wrap(topic.title, timesB, 13, maxW - 24);
				for (const line of titleWrap) {
					need(16);
					page.drawText(line, {
						x: 76,
						y,
						size: 13,
						font: timesB,
						color: INK
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
				page.drawText("·", {
					x: MARGIN,
					y,
					size: 12,
					font: timesB,
					color: BRAND
				});
				const lines = wrap(d, times, 11, maxW - 16);
				for (const line of lines) {
					need(15);
					page.drawText(line, {
						x: 68,
						y,
						size: 11,
						font: times,
						color: INK
					});
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
					page.drawText(who, {
						x: MARGIN,
						y,
						size: 9,
						font: helvB,
						color: BRAND
					});
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
					page.drawText(q.speaker, {
						x: MARGIN,
						y,
						size: 9,
						font: helvB,
						color: BRAND
					});
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
		para("Frames captured when the shared meeting screen changed, pinned on purpose, or attached after the call.", timesI, 10, 13, MUTED);
		y -= 8;
		for (let i = 0; i < session.screenshots.length; i += 1) {
			const shot = session.screenshots[i];
			const parsed = dataUrlToBytes(shot.dataUrl);
			if (!parsed) continue;
			try {
				const img = parsed.jpeg ? await pdf.embedJpg(parsed.bytes) : await pdf.embedPng(parsed.bytes);
				const scale = Math.min(maxW / img.width, 280 / img.height, 1);
				const w = img.width * scale;
				const h = img.height * scale;
				need(h + 36);
				const t = formatDuration(shot.t);
				page.drawText(`${t}${shot.caption ? "  —  " + shot.caption : ""}`.slice(0, 110), {
					x: MARGIN,
					y,
					size: 9,
					font: helv,
					color: MUTED
				});
				y -= 12;
				page.drawImage(img, {
					x: MARGIN,
					y: y - h,
					width: w,
					height: h
				});
				y -= h + 18;
			} catch {}
		}
	}
	heading("Full transcript");
	para(flag.lost ? "Everything that was heard, in order. Characters this PDF cannot draw (for example Hindi or emoji) show as ?. The complete original text is in the on-screen briefing and the Markdown export." : "Everything that was heard during the session, in order.", timesI, 10, 13, MUTED);
	y -= 8;
	if (session.segments.length) for (const seg of session.segments) {
		const stampT = formatDuration(seg.t);
		const speaker = seg.speaker ? `${seg.speaker}  ` : "";
		need(28);
		page.drawText(`${stampT}  ${speaker}`.trim(), {
			x: MARGIN,
			y,
			size: 8,
			font: helvB,
			color: BRAND
		});
		y -= 12;
		para(seg.text, times, 10, 13);
		y -= 6;
	}
	else if (session.transcriptText.trim()) para(session.transcriptText, times, 10, 13);
	else para("No speech was captured in this session.", timesI, 11, 14, MUTED);
	stamp(page, pdf.getPageCount());
	pdf.setTitle(`${session.title} — Debrief`);
	pdf.setAuthor("Debrief");
	pdf.setSubject("Meeting briefing: purpose, topics, screenshots, links, and full transcript");
	pdf.setKeywords([
		"meeting",
		"briefing",
		"transcript",
		platformLabel(session.platform)
	]);
	pdf.setProducer("Debrief");
	pdf.setCreationDate(new Date(session.startedAt ?? session.createdAt));
	return pdf.save();
}
async function briefPdfBlob(session) {
	const bytes = await buildBriefPdf(session);
	return new Blob([bytes], { type: "application/pdf" });
}
async function downloadBriefPdf(session) {
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
async function openBriefPdf(session) {
	const blob = await briefPdfBlob(session);
	return URL.createObjectURL(blob);
}
function BriefPage() {
	const { id } = Route$1.useParams();
	const { session, ready } = useSession(id);
	const navigate = useNavigate();
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [rewriting, setRewriting] = (0, import_react.useState)(false);
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const [pdfUrl, setPdfUrl] = (0, import_react.useState)(null);
	const [showPdf, setShowPdf] = (0, import_react.useState)(false);
	const brief = session?.brief;
	const filteredSegments = (0, import_react.useMemo)(() => {
		if (!session) return [];
		const q = query.trim().toLowerCase();
		if (!q) return session.segments;
		return session.segments.filter((s) => {
			return `${s.speaker ?? ""} ${s.text}`.toLowerCase().includes(q);
		});
	}, [session, query]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl);
		};
	}, []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground",
		children: "Loading briefing…"
	}) });
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-xl px-4 py-20 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-serif text-3xl",
			children: "Briefing not found"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Back home"
			})
		})]
	}) });
	const current = session;
	async function onDownload() {
		setSaving(true);
		try {
			await downloadBriefPdf(current);
			toast.success("PDF saved");
		} catch {
			toast.error("Could not build the PDF.");
		} finally {
			setSaving(false);
		}
	}
	async function onPreview() {
		setSaving(true);
		try {
			const url = await openBriefPdf(current);
			setPdfUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return url;
			});
			setShowPdf(true);
		} catch {
			toast.error("Could not open the PDF.");
		} finally {
			setSaving(false);
		}
	}
	async function onCopy() {
		try {
			await navigator.clipboard.writeText(briefingMarkdown(current));
			toast.success("Briefing copied");
		} catch {
			toast.error("Could not copy.");
		}
	}
	function onMarkdown() {
		const blob = new Blob([briefingMarkdown(current)], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${current.title.replace(/[^\w\s-]+/g, "").trim().replace(/\s+/g, "-") || "briefing"}.md`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1500);
	}
	async function onRewrite() {
		if (!current.transcriptText.trim()) return;
		setRewriting(true);
		try {
			const { brief: nextBrief, captions } = await produceBrief(current);
			const screenshots = current.screenshots.map((s, i) => ({
				...s,
				caption: captions[i] ?? s.caption
			}));
			await saveSession({
				...current,
				brief: nextBrief,
				screenshots,
				status: "ready"
			});
			toast.success("Briefing rewritten");
		} catch {
			toast.error("Could not rewrite the briefing.");
		} finally {
			setRewriting(false);
		}
	}
	async function onAttach(file) {
		if (!file) return;
		if (current.screenshots.length >= 20) {
			toast.message("Screenshot limit reached for this briefing.");
			return;
		}
		const dataUrl = await fileToJpegDataUrl(file);
		if (!dataUrl) {
			toast.error("Could not read that image.");
			return;
		}
		const shot = {
			id: crypto.randomUUID(),
			t: current.durationMs,
			dataUrl,
			caption: file.name.replace(/\.[^.]+$/, ""),
			important: true
		};
		await saveSession({
			...current,
			screenshots: [...current.screenshots, shot]
		});
		toast.success("Screenshot attached — download the PDF again to include it.");
	}
	async function onDelete() {
		if (!confirmDelete) {
			setConfirmDelete(true);
			return;
		}
		await removeSession(current.id);
		await navigate({ to: "/" });
	}
	const when = new Date(session.startedAt ?? session.createdAt).toLocaleString(void 0, {
		dateStyle: "medium",
		timeStyle: "short"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4",
				"data-no-print": true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						asChild: true,
						className: "-ml-3 w-fit",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Archive"]
						})
					}),
					brief ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 rounded-xl bg-paper-deep px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: "The briefing PDF is ready."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-sm text-muted-foreground",
							children: "Purpose first. If it matters, read the rest — or download everything."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => void onDownload(),
							disabled: saving,
							className: "shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), saving && !showPdf ? "Building PDF" : "Download PDF"]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: () => void onPreview(),
								disabled: saving || !brief,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" }), showPdf ? "Rebuild preview" : "Preview PDF"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: () => void onCopy(),
								disabled: !brief,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "Copy"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: onMarkdown,
								disabled: !brief,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4" }), "Markdown"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: () => void onRewrite(),
								disabled: rewriting || !session.transcriptText.trim(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), rewriting ? "Rewriting" : "Rewrite"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "inline-flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: "image/*",
									className: "sr-only",
									onChange: (e) => {
										onAttach(e.target.files?.[0]);
										e.target.value = "";
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-card px-4 text-sm font-medium shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] sm:w-auto",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-4" }), "Attach screen"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: () => void onDelete(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), confirmDelete ? "Confirm remove" : "Remove"]
							})
						]
					})
				]
			}),
			showPdf && pdfUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				"data-no-print": true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "PDF preview"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground",
						onClick: () => setShowPdf(false),
						"aria-label": "Hide PDF preview",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
					title: "Briefing PDF",
					src: pdfUrl,
					className: "h-[70vh] w-full rounded-xl bg-card shadow-[var(--shadow-border)]"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.16em] text-brand uppercase",
						children: "Session briefing"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-serif text-4xl leading-tight sm:text-5xl",
						children: session.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: [
							platformLabel(session.platform),
							" · ",
							formatDuration(session.durationMs),
							" ·",
							" ",
							when
						]
					}),
					session.url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: session.url,
						className: "mt-1 inline-block text-sm break-all text-brand hover:underline",
						target: "_blank",
						rel: "noreferrer",
						children: session.url
					}) : null,
					!brief ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-10 text-sm text-muted-foreground",
						children: [
							"This session has no briefing yet.",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/session/$id",
								params: { id: session.id },
								className: "text-brand underline-offset-4 hover:underline",
								children: "Open the session"
							}),
							"."
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-10",
							id: "purpose",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xs font-medium tracking-[0.16em] text-brand uppercase",
								children: "Purpose of this meeting"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-lg leading-relaxed",
								children: brief.purpose
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xs font-medium tracking-[0.16em] text-brand uppercase",
								children: "In short"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 leading-relaxed text-muted-foreground",
								children: brief.summary
							})]
						}),
						brief.participants.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 text-sm text-muted-foreground",
							children: brief.participants.join(" · ")
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-10" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-serif text-2xl",
							children: "Topics, explained"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "mt-6 grid gap-8",
							children: brief.topics.map((topic, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "grid gap-2 sm:grid-cols-[2rem_1fr]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-serif text-xl text-brand",
									children: i + 1
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-serif text-xl",
									children: topic.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 leading-relaxed text-muted-foreground",
									children: topic.explanation
								})] })]
							}, `${topic.title}-${i}`))
						})] }),
						brief.decisions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-12",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-serif text-2xl",
								children: "Decisions"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 grid gap-2",
								children: brief.decisions.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-3 text-sm leading-relaxed",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-2 size-1.5 shrink-0 rounded-full bg-brand" }), d]
								}, d))
							})]
						}) : null,
						brief.actionItems.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-12",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-serif text-2xl",
								children: "Action items"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 grid gap-3",
								children: brief.actionItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "rounded-lg bg-muted/80 px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium",
										children: item.task
									}), item.owner || item.due ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-muted-foreground",
										children: [item.owner, item.due].filter(Boolean).join(" · ")
									}) : null]
								}, item.task))
							})]
						}) : null,
						brief.quotes.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-12",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-serif text-2xl",
								children: "What was said"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 grid gap-4",
								children: brief.quotes.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "border-l-2 border-brand/40 pl-4",
									children: [q.speaker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium tracking-wide text-brand uppercase",
										children: q.speaker
									}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-serif text-lg leading-relaxed italic",
										children: q.text
									})]
								}, q.text))
							})]
						}) : null,
						brief.links.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-12",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-serif text-2xl",
								children: "Links mentioned"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 grid gap-3",
								children: brief.links.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: link.context
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: link.url,
									className: "text-sm break-all text-brand hover:underline",
									target: "_blank",
									rel: "noreferrer",
									children: link.url
								})] }, link.url))
							})]
						}) : null,
						session.notes.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-12",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-serif text-2xl",
								children: "Listener notes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 whitespace-pre-wrap leading-relaxed text-muted-foreground",
								children: session.notes
							})]
						}) : null,
						session.screenshots.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-12",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-serif text-2xl",
								children: "Important screens"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 grid gap-6",
								children: session.screenshots.map((shot) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
									className: "grid gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: shot.dataUrl,
										alt: shot.caption || "Meeting screen",
										className: "w-full rounded-lg outline outline-1 -outline-offset-1 outline-foreground/10"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
										className: "text-xs text-muted-foreground",
										children: [formatDuration(shot.t), shot.caption ? ` — ${shot.caption}` : ""]
									})]
								}, shot.id))
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-12",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-serif text-2xl",
										children: "Full transcript"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-muted-foreground",
										children: "Everything that was heard, in order."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-2",
										"data-no-print": true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											children: [session.segments.length || (session.transcriptText ? 1 : 0), " lines"]
										})
									})]
								}),
								(session.segments.length > 6 || session.transcriptText.length > 400) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4",
									"data-no-print": true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										"aria-label": "Search transcript",
										placeholder: "Search the transcript",
										value: query,
										onChange: (e) => setQuery(e.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 space-y-3",
									children: session.segments.length > 0 ? filteredSegments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Nothing matches that search."
									}) : filteredSegments.map((seg) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm leading-relaxed",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mr-2 font-mono text-[11px] text-brand tabular-nums",
												children: formatDuration(seg.t)
											}),
											seg.speaker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mr-1 font-medium",
												children: seg.speaker
											}) : null,
											seg.text
										]
									}, seg.id)) : session.transcriptText.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "whitespace-pre-wrap text-sm leading-relaxed",
										children: session.transcriptText
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "No speech was captured in this session."
									})
								})
							]
						})
					] })
				]
			})
		]
	}) });
}
//#endregion
export { BriefPage as component };
