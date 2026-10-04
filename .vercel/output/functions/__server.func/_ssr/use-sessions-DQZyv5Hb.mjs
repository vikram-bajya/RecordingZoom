import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, r as Slot, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-sessions-DQZyv5Hb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-border/80",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							className: "grid size-8 place-items-center rounded-sm bg-primary text-lg leading-none font-serif text-primary-foreground",
							children: "D"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-serif text-xl tracking-tight italic",
							children: "Debrief"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex items-center gap-1 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/#how",
							className: "inline-flex h-11 items-center rounded-md px-3 text-muted-foreground transition-colors duration-150 hover:text-foreground",
							children: "How it works"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							hash: "archive",
							className: "inline-flex h-11 items-center rounded-md px-3 text-muted-foreground transition-colors duration-150 hover:text-foreground",
							children: "Archive"
						})]
					})]
				})
			}),
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "top-center",
				theme: "light",
				toastOptions: { className: "font-sans" }
			})
		]
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatDuration(ms) {
	const total = Math.max(0, Math.floor(ms / 1e3));
	const h = Math.floor(total / 3600);
	const m = Math.floor(total % 3600 / 60);
	const s = total % 60;
	if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function formatClock(ms) {
	const total = Math.max(0, Math.floor(ms / 1e3));
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function isEmbeddedBrowser() {
	if (typeof window === "undefined") return false;
	try {
		return window.self !== window.top;
	} catch {
		return true;
	}
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-secondary text-secondary-foreground",
		brand: "bg-brand/10 text-brand",
		live: "bg-live/10 text-live",
		outline: "shadow-[var(--shadow-border)] text-muted-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow-[var(--shadow-border)] hover:opacity-90",
			brand: "bg-brand text-brand-foreground shadow-[var(--shadow-border)] hover:opacity-90",
			secondary: "bg-secondary text-secondary-foreground shadow-[var(--shadow-border)] hover:bg-muted",
			outline: "bg-card text-foreground shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			ghost: "text-foreground hover:bg-accent",
			live: "bg-live text-primary-foreground hover:opacity-90",
			link: "text-brand underline-offset-4 hover:underline"
		},
		size: {
			default: "h-11 rounded-md px-4",
			sm: "h-9 rounded-sm px-3 text-sm",
			lg: "h-12 rounded-lg px-5",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var RULES = [
	{
		id: "zoom",
		label: "Zoom",
		test: /zoom\.(us|com)/i
	},
	{
		id: "meet",
		label: "Google Meet",
		test: /meet\.google\.com/i
	},
	{
		id: "teams",
		label: "Microsoft Teams",
		test: /(teams\.microsoft\.com|teams\.live\.com)/i
	},
	{
		id: "webex",
		label: "Webex",
		test: /webex\.com/i
	},
	{
		id: "discord",
		label: "Discord",
		test: /(discord\.com|discord\.gg)/i
	},
	{
		id: "slack",
		label: "Slack",
		test: /app\.slack\.com/i
	},
	{
		id: "jitsi",
		label: "Jitsi",
		test: /meet\.jit\.si/i
	},
	{
		id: "whereby",
		label: "Whereby",
		test: /whereby\.com/i
	},
	{
		id: "around",
		label: "Around",
		test: /around\.co/i
	},
	{
		id: "goto",
		label: "GoTo Meeting",
		test: /(gotomeeting\.com|meet\.goto\.com)/i
	}
];
var PLATFORM_LABELS = [
	{
		id: "zoom",
		label: "Zoom"
	},
	{
		id: "meet",
		label: "Google Meet"
	},
	{
		id: "teams",
		label: "Microsoft Teams"
	},
	{
		id: "webex",
		label: "Webex"
	},
	{
		id: "discord",
		label: "Discord"
	},
	{
		id: "slack",
		label: "Slack"
	},
	{
		id: "jitsi",
		label: "Jitsi"
	},
	{
		id: "whereby",
		label: "Whereby"
	},
	{
		id: "around",
		label: "Around"
	},
	{
		id: "goto",
		label: "GoTo Meeting"
	},
	{
		id: "other",
		label: "Any browser call"
	}
];
function detectPlatform(url) {
	for (const rule of RULES) if (rule.test.test(url)) return {
		id: rule.id,
		label: rule.label
	};
	return {
		id: "other",
		label: "Meeting"
	};
}
function platformLabel(id) {
	return PLATFORM_LABELS.find((r) => r.id === id)?.label ?? "Meeting";
}
function isHttpUrl(value) {
	try {
		const u = new URL(value.trim());
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}
function normalizeUrl(value) {
	const trimmed = value.trim();
	if (!trimmed) return "";
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	return `https://${trimmed}`;
}
var SAMPLE_SESSION_ID = "sample-atlas-q3";
function slide(title, lines, accent = "#3f5368") {
	const canvas = document.createElement("canvas");
	canvas.width = 1280;
	canvas.height = 720;
	const ctx = canvas.getContext("2d");
	if (!ctx) return "";
	ctx.fillStyle = "#1c1b19";
	ctx.fillRect(0, 0, 1280, 720);
	ctx.fillStyle = "#fcfaf6";
	ctx.fillRect(48, 48, 1184, 624);
	ctx.fillStyle = accent;
	ctx.fillRect(48, 48, 12, 624);
	ctx.fillStyle = "#1c1b19";
	ctx.font = "600 42px 'Instrument Sans', system-ui, sans-serif";
	ctx.fillText(title, 96, 140);
	ctx.fillStyle = "#e2ddd3";
	ctx.fillRect(96, 168, 320, 2);
	ctx.font = "400 26px 'Instrument Sans', system-ui, sans-serif";
	ctx.fillStyle = "#3f4140";
	lines.forEach((line, i) => {
		ctx.fillText(line, 96, 230 + i * 52);
	});
	ctx.fillStyle = "#6d6a63";
	ctx.font = "400 16px 'Instrument Sans', system-ui, sans-serif";
	ctx.fillText("Atlas Q3 · internal", 96, 630);
	return canvas.toDataURL("image/jpeg", .72);
}
function buildSampleScreenshots() {
	if (typeof document === "undefined") return [];
	return [
		{
			id: "ss-1",
			t: 24e4,
			important: true,
			caption: "Launch window locked to the week of October 14.",
			dataUrl: slide("Atlas Search — Q3 launch", [
				"Public beta      week of 14 Oct",
				"GA               4 Nov",
				"Docs freeze      30 Sep",
				"Pricing page     ships with beta"
			])
		},
		{
			id: "ss-2",
			t: 108e4,
			important: true,
			caption: "API shape: POST /v1/search with filters on collection and recency.",
			dataUrl: slide("Search API v1", [
				"POST /v1/search",
				"query, collection, recency_days",
				"Response: hits[], next_cursor",
				"Rate limit: 60 req / min / key"
			], "#2f5d45")
		},
		{
			id: "ss-3",
			t: 186e4,
			important: true,
			caption: "Starter free tier plus Team at $29 / seat. Enterprise later.",
			dataUrl: slide("Pricing hypothesis", [
				"Starter     free · 2k queries / mo",
				"Team        $29 / seat / mo",
				"Usage over  $8 / extra 10k queries",
				"Enterprise  conversation next quarter"
			], "#9a3b2a")
		}
	];
}
var TRANSCRIPT = `Priya: Thanks everyone for joining. The purpose of this meeting is to lock the Atlas Search launch plan for Q3, agree the API surface, and decide how we talk about pricing on the public page.

Marcus: I'll start with the timeline. Engineering can hit a public beta the week of October 14 if docs freeze on September 30. GA on November 4. That is the date I want us to commit to.

Priya: Lock it. Week of October 14 for beta, November 4 for GA. If something slips, we slip the announcement, not the quality bar.

Lina: On the API: we should ship a single endpoint, POST /v1/search. Body has query, collection, and recency_days. Response is hits and a next_cursor. I put the draft in the spec at https://github.com/atlas-labs/search-spec.

Marcus: Rate limit? I'm thinking 60 requests per minute per key for Team.

Lina: Yes. Starter stays at 20. I'll write that into the spec today.

Priya: Please also link the Figma for the results page, Lina. It is https://www.figma.com/file/atlas-search-results.

Lina: Done. One more thing — filters on collection must be exact match for beta. Fuzzy collection names are a v1.1 item, not launch.

Marcus: Agreed. Fuzzy is a follow-up.

Priya: Pricing. Finance sent a one-pager, https://docs.google.com/document/d/atlas-search-pricing. Proposal is Starter free with 2,000 queries a month, Team at 29 dollars per seat, overage at 8 dollars per extra 10,000 queries. Enterprise is a conversation, not a page.

Marcus: I do not want a public Enterprise number. It always gets screenshot and used against us.

Priya: Decision: no Enterprise price on the site. Talk to sales.

Lina: Who owns the pricing page copy?

Priya: Jordan on marketing. Jordan, can you take first draft by Friday?

Jordan: Yes. I will send a draft Friday and need engineering to confirm the free-tier numbers. Also, the help article should live at https://docs.atlas.dev/search/start.

Marcus: I'll review that article Monday.

Priya: Hiring — we still need one search engineer. Recruiter is already running the req. If anyone has referrals, send them this week.

Lina: I can intro two people from my last team.

Priya: Please do. Recap of decisions: launch dates locked, API is POST /v1/search, no fuzzy filters at beta, Starter plus Team pricing only on the public page, Jordan drafts the pricing page, Marcus reviews docs Monday.

Marcus: And I will send the incident runbook link after this call, https://notion.so/atlas-search-runbook.

Priya: Perfect. That is the purpose of this meeting covered. Thanks everyone.`;
function createSampleSession() {
	const createdAt = Date.now() - 936e5;
	return {
		id: SAMPLE_SESSION_ID,
		title: "Atlas Search — Q3 launch sync",
		url: "https://meet.google.com/abc-defg-hij",
		platform: "meet",
		status: "ready",
		createdAt,
		startedAt: createdAt + 6e4,
		endedAt: createdAt + 6e4 + 228e4,
		durationMs: 228e4,
		transcriptText: TRANSCRIPT,
		notes: "Watch for the docs freeze on 30 Sep. Pricing page must ship with beta.",
		segments: TRANSCRIPT.split("\n").map((line) => line.trim()).filter(Boolean).map((line, i) => {
			const idx = line.indexOf(":");
			const speaker = idx > 0 && idx < 18 ? line.slice(0, idx) : void 0;
			const text = speaker ? line.slice(idx + 1).trim() : line;
			return {
				id: `seg-${i}`,
				t: i * 9e4,
				speaker,
				text
			};
		}),
		screenshots: [],
		brief: {
			purpose: "Lock the Atlas Search Q3 launch plan: dates, the v1 API surface, public pricing, and owners for docs and the pricing page.",
			summary: "The team committed to a public beta the week of 14 October and GA on 4 November, with a docs freeze on 30 September. Search ships as a single POST /v1/search endpoint. Public pricing is Starter (free) and Team ($29/seat); Enterprise stays off the website. Jordan drafts the pricing page, Marcus reviews docs, Lina updates the spec.",
			topics: [
				{
					title: "Launch timeline",
					explanation: "Engineering can hit public beta the week of 14 October if documentation freezes on 30 September. General availability is 4 November. If work slips, the announcement slips — the quality bar does not."
				},
				{
					title: "Search API v1",
					explanation: "A single endpoint, POST /v1/search, with query, collection, and recency_days in the body. Responses return hits and a next_cursor. Collection filters are exact-match only for beta; fuzzy collection names wait for v1.1. Rate limits: 20 req/min on Starter, 60 on Team."
				},
				{
					title: "Pricing on the public page",
					explanation: "Starter is free with 2,000 queries per month. Team is $29 per seat per month, with overage at $8 per extra 10,000 queries. No public Enterprise price — that number would be screenshotted and used in negotiations. Sales handles Enterprise privately."
				},
				{
					title: "Owners and hiring",
					explanation: "Jordan (marketing) drafts pricing-page copy by Friday. Marcus reviews the help article Monday. Lina writes rate limits into the spec today and will intro two search-engineer referrals. One search-engineer req is already open."
				}
			],
			decisions: [
				"Public beta the week of 14 October; GA on 4 November; docs freeze 30 September.",
				"Ship one endpoint: POST /v1/search. Fuzzy collection filters are not in beta.",
				"Public pricing is Starter + Team only. No Enterprise price on the website.",
				"Announcement slips before quality does."
			],
			actionItems: [
				{
					owner: "Lina",
					task: "Write rate limits into the search spec and share the Figma for the results page.",
					due: "Today"
				},
				{
					owner: "Jordan",
					task: "First draft of the public pricing page copy.",
					due: "Friday"
				},
				{
					owner: "Marcus",
					task: "Review the help article at docs.atlas.dev/search/start and send the incident runbook.",
					due: "Monday"
				},
				{
					owner: "Lina",
					task: "Intro two search-engineer referrals to the recruiter.",
					due: "This week"
				}
			],
			links: [
				{
					url: "https://github.com/atlas-labs/search-spec",
					context: "Draft API spec for POST /v1/search"
				},
				{
					url: "https://www.figma.com/file/atlas-search-results",
					context: "Results page design"
				},
				{
					url: "https://docs.google.com/document/d/atlas-search-pricing",
					context: "Finance one-pager for pricing"
				},
				{
					url: "https://docs.atlas.dev/search/start",
					context: "Public help article to review"
				},
				{
					url: "https://notion.so/atlas-search-runbook",
					context: "Incident runbook Marcus will send"
				}
			],
			quotes: [{
				speaker: "Priya",
				text: "If something slips, we slip the announcement, not the quality bar."
			}, {
				speaker: "Marcus",
				text: "I do not want a public Enterprise number. It always gets screenshot and used against us."
			}],
			participants: [
				"Priya",
				"Marcus",
				"Lina",
				"Jordan"
			]
		},
		source: "sample",
		language: "en"
	};
}
var DB_NAME = "debrief-sessions";
var STORE = "sessions";
var DB_VERSION = 1;
var memory = [];
var hydrated = false;
var listeners = /* @__PURE__ */ new Set();
function emit() {
	for (const l of listeners) l();
}
function subscribeSessions(listener) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
function getSessionsSnapshot() {
	return memory;
}
function getHydratedSnapshot() {
	return hydrated;
}
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("indexedDB open failed"));
	});
}
function withTimeout(promise, ms) {
	return new Promise((resolve, reject) => {
		const t = setTimeout(() => reject(/* @__PURE__ */ new Error("storage timeout")), ms);
		promise.then((v) => {
			clearTimeout(t);
			resolve(v);
		}, (e) => {
			clearTimeout(t);
			reject(e);
		});
	});
}
async function idbAll() {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
		req.onsuccess = () => resolve(req.result ?? []);
		req.onerror = () => reject(req.error);
	});
}
async function idbPut(session) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(session);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function idbDelete(id) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
function sortSessions(list) {
	return [...list].sort((a, b) => b.createdAt - a.createdAt);
}
function normalize(session) {
	return {
		...session,
		notes: session.notes ?? "",
		screenshots: session.screenshots ?? [],
		segments: session.segments ?? [],
		brief: session.brief ? {
			...session.brief,
			quotes: session.brief.quotes ?? [],
			participants: session.brief.participants ?? []
		} : session.brief
	};
}
function makeSample(withShots) {
	const sample = createSampleSession();
	if (!withShots) return sample;
	try {
		sample.screenshots = buildSampleScreenshots();
	} catch {
		sample.screenshots = [];
	}
	return sample;
}
async function hydrateSessions() {
	if (typeof window === "undefined") return;
	if (hydrated) return;
	const fallback = makeSample(false);
	memory = [fallback];
	hydrated = true;
	emit();
	try {
		fallback.screenshots = makeSample(true).screenshots;
		emit();
	} catch {}
	try {
		const stored = await withTimeout(idbAll(), 2e3);
		if (stored.length === 0) {
			await idbPut(fallback).catch(() => void 0);
			return;
		}
		const next = sortSessions(stored.map(normalize));
		const sample = next.find((s) => s.id === SAMPLE_SESSION_ID);
		if (sample && sample.screenshots.length === 0) {
			sample.screenshots = fallback.screenshots;
			await idbPut(sample).catch(() => void 0);
		}
		memory = next;
		emit();
	} catch {}
}
function getSession(id) {
	return memory.find((s) => s.id === id);
}
async function saveSession(session) {
	const normalized = normalize(session);
	const idx = memory.findIndex((s) => s.id === normalized.id);
	if (idx >= 0) memory[idx] = normalized;
	else memory = [normalized, ...memory];
	memory = sortSessions(memory);
	emit();
	try {
		await withTimeout(idbPut(normalized), 2e3);
	} catch {}
}
async function removeSession(id) {
	memory = memory.filter((s) => s.id !== id);
	emit();
	try {
		await withTimeout(idbDelete(id), 2e3);
	} catch {}
}
function newSessionId() {
	return crypto.randomUUID();
}
var EMPTY_SESSIONS = [];
function useSessions() {
	const sessions = (0, import_react.useSyncExternalStore)(subscribeSessions, getSessionsSnapshot, () => EMPTY_SESSIONS);
	const ready = (0, import_react.useSyncExternalStore)(subscribeSessions, getHydratedSnapshot, () => false);
	(0, import_react.useEffect)(() => {
		hydrateSessions();
	}, []);
	return {
		sessions,
		ready
	};
}
function useSession(id) {
	const { sessions, ready } = useSessions();
	if (!id) return {
		session: void 0,
		ready
	};
	const fromList = sessions.find((s) => s.id === id);
	if (fromList) return {
		session: fromList,
		ready
	};
	if (!ready) return {
		session: void 0,
		ready
	};
	try {
		return {
			session: getSession(id),
			ready
		};
	} catch {
		return {
			session: void 0,
			ready
		};
	}
}
//#endregion
export { useSession as _, SAMPLE_SESSION_ID as a, formatClock as c, isHttpUrl as d, newSessionId as f, saveSession as g, removeSession as h, PLATFORM_LABELS as i, formatDuration as l, platformLabel as m, Badge as n, cn as o, normalizeUrl as p, Button as r, detectPlatform as s, AppShell as t, isEmbeddedBrowser as u, useSessions as v };
