import { i as __toESM } from "../_runtime.mjs";
import { i as getProvider, n as extractJson, r as geminiText, t as NO_KEY_MESSAGE } from "./provider.server-DrBgsO-M.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as createFileRoute, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as string, i as object, n as literal, o as union, r as number } from "../_libs/zod.mjs";
import { n as TriangleAlert } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BEOUVpOq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-destructive",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-2xl",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted-foreground",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-BoPl_1M6.css";
var APP_NAME = "Debrief";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Paste a Zoom, Google Meet, or Teams link. Debrief listens to the session and writes a PDF of every topic, decision, screenshot, and link."
			},
			{
				name: "theme-color",
				content: "#f4f1ea"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Instrument+Serif:ital@0;1&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$2 = () => import("./routes-Dm8ZQFn-.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var MAX_BYTES = 24e6;
var Route$2 = createFileRoute("/api/transcribe")({ server: { handlers: { POST: async ({ request }) => {
	const cfg = getProvider();
	if (!cfg) return Response.json({
		ok: false,
		error: NO_KEY_MESSAGE
	}, { status: 503 });
	const form = await request.formData();
	const file = form.get("file");
	if (!(file instanceof File) || file.size === 0) return Response.json({
		ok: false,
		error: "No audio file received"
	}, { status: 400 });
	if (file.size > MAX_BYTES) return Response.json({
		ok: false,
		error: "That clip is too large for a single pass. Debrief will split it."
	}, { status: 413 });
	const language = String(form.get("language") ?? "en").trim() || "en";
	if (cfg.provider === "gemini") return transcribeWithGemini(cfg, file, language);
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
		body: outbound
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		return Response.json({
			ok: false,
			error: `Transcription failed (${res.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`
		}, { status: 502 });
	}
	const body = await res.json();
	const words = body.words ?? [];
	const segments = [];
	let current;
	for (const w of words) {
		const token = (w.text ?? w.word ?? "").trim();
		if (!token) continue;
		const start = typeof w.start === "number" ? w.start : 0;
		if (!current || current.speaker !== w.speaker) {
			if (current && current.words.length) segments.push({
				t: Math.round(current.t * 1e3),
				speaker: current.speaker !== void 0 ? `Speaker ${current.speaker + 1}` : void 0,
				text: current.words.join(" ")
			});
			current = {
				speaker: w.speaker,
				t: start,
				words: [token]
			};
		} else current.words.push(token);
	}
	if (current && current.words.length) segments.push({
		t: Math.round(current.t * 1e3),
		speaker: current.speaker !== void 0 ? `Speaker ${current.speaker + 1}` : void 0,
		text: current.words.join(" ")
	});
	const text = (body.text ?? body.transcript ?? "").trim();
	return Response.json({
		ok: true,
		text: text || segments.map((s) => s.text).join(" "),
		duration: body.duration ?? 0,
		segments
	});
} } } });
async function transcribeWithGemini(cfg, file, language) {
	const bytes = Buffer.from(await file.arrayBuffer());
	const mime = file.type && file.type.startsWith("audio/") ? file.type : "audio/wav";
	const prompt = `Transcribe this meeting audio word for word in its original language (language hint: ${language}). Do not summarize, translate, or invent words. If there is no speech, return an empty segments array.
If different people speak, label them "Speaker 1", "Speaker 2", and so on, consistently.
Return JSON only: {"segments":[{"start": <seconds from the start of this clip>, "speaker": "Speaker 1", "text": "..."}]}`;
	let res;
	try {
		res = await fetch(`${cfg.baseUrl}/models/${cfg.sttModel}:generateContent`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-goog-api-key": cfg.apiKey
			},
			body: JSON.stringify({
				contents: [{
					role: "user",
					parts: [{ inlineData: {
						mimeType: mime,
						data: bytes.toString("base64")
					} }, { text: prompt }]
				}],
				generationConfig: {
					temperature: 0,
					maxOutputTokens: 8192,
					responseMimeType: "application/json"
				}
			})
		});
	} catch {
		return Response.json({
			ok: false,
			error: "Could not reach the transcription service"
		}, { status: 502 });
	}
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		return Response.json({
			ok: false,
			error: `Transcription failed (${res.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`
		}, { status: 502 });
	}
	const raw = geminiText(await res.json());
	let list = [];
	try {
		const parsed = extractJson(raw);
		list = Array.isArray(parsed.segments) ? parsed.segments : [];
	} catch {
		if (raw) list = [{ text: raw }];
	}
	const segments = [];
	let last = 0;
	for (const item of list) {
		const text = String(item.text ?? "").trim();
		if (!text) continue;
		const start = typeof item.start === "number" && item.start >= last ? item.start : last;
		last = start;
		segments.push({
			t: Math.round(start * 1e3),
			speaker: item.speaker ? String(item.speaker).slice(0, 40) : void 0,
			text
		});
	}
	return Response.json({
		ok: true,
		text: segments.map((s) => s.text).join(" "),
		duration: 0,
		segments
	});
}
var $$splitComponentImporter$1 = () => import("../_id-DpGY6eRH.mjs");
var Route$1 = createFileRoute("/brief/$id")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("../_id-B4lMQo-I.mjs");
var Route = createFileRoute("/session/$id")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	ApiTranscribeRoute: Route$2.update({
		id: "/api/transcribe",
		path: "/api/transcribe",
		getParentRoute: () => Route$4
	}),
	BriefIdRoute: Route$1.update({
		id: "/brief/$id",
		path: "/brief/$id",
		getParentRoute: () => Route$4
	}),
	SessionIdRoute: Route.update({
		id: "/session/$id",
		path: "/session/$id",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Route as n, Route$1 as r, router_exports as t };
