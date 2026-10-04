import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as FileText, f as FileAudio, l as Link2, v as ArrowRight } from "../_libs/lucide-react.mjs";
import { a as SAMPLE_SESSION_ID, d as isHttpUrl, f as newSessionId, g as saveSession, i as PLATFORM_LABELS, l as formatDuration, m as platformLabel, n as Badge, o as cn, p as normalizeUrl, r as Button, s as detectPlatform, t as AppShell, v as useSessions } from "./use-sessions-DQZyv5Hb.mjs";
import { a as Textarea, i as SESSION_LANGUAGES, n as FileDrop, o as fileHandoff, r as Label, t as Card } from "./languages-B8p-qoo8.mjs";
import { t as Input } from "./input-BMyqbHsS.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dm8ZQFn-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-4 focus-visible:outline-none", className),
	...props
}));
TabsContent.displayName = Content.displayName;
var MEETING_HOST = /https?:\/\/[^\s<>)"']*(?:zoom\.(?:us|com)|meet\.google\.com|teams\.microsoft\.com|teams\.live\.com|webex\.com|discord\.(?:com|gg)|app\.slack\.com|meet\.jit\.si|whereby\.com|around\.co|gotomeeting\.com|meet\.goto\.com)[^\s<>)"']*/i;
var ANY_URL = /https?:\/\/[^\s<>)"']+/i;
function extractMeetingUrl(text) {
	const t = text.trim();
	if (!t) return null;
	const meeting = t.match(MEETING_HOST)?.[0];
	if (meeting) return stripTrail(meeting);
	if (isHttpUrl(t) || isHttpUrl(normalizeUrl(t))) {
		const n = normalizeUrl(t.split(/\s+/)[0] ?? t);
		if (isHttpUrl(n) && n.length < 2e3) return n;
	}
	const any = t.match(ANY_URL)?.[0];
	return any ? stripTrail(any) : null;
}
function stripTrail(url) {
	return url.replace(/[.,;:]+$/g, "");
}
var selectClass = "flex h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-[var(--shadow-border)] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none";
function Home() {
	const navigate = useNavigate();
	const { sessions } = useSessions();
	const [url, setUrl] = (0, import_react.useState)("");
	const [title, setTitle] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [language, setLanguage] = (0, import_react.useState)("en");
	const [query, setQuery] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const platform = (0, import_react.useMemo)(() => {
		const n = normalizeUrl(url);
		return isHttpUrl(n) ? detectPlatform(n) : null;
	}, [url]);
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (!q) return sessions;
		return sessions.filter((s) => {
			return `${s.title} ${platformLabel(s.platform)} ${s.url}`.toLowerCase().includes(q);
		});
	}, [sessions, query]);
	function applyUrl(value) {
		const found = extractMeetingUrl(value);
		if (found && value.trim().length > found.length + 8) {
			setUrl(found);
			return;
		}
		setUrl(value);
	}
	async function createAndGo(partial) {
		setBusy(true);
		const session = {
			id: newSessionId(),
			title: partial.title.trim() || `${platformLabel(partial.platform)} session`,
			url: partial.url,
			platform: partial.platform,
			status: "setup",
			createdAt: Date.now(),
			durationMs: 0,
			transcriptText: partial.transcriptText ?? "",
			segments: [],
			screenshots: [],
			notes: "",
			source: partial.source,
			language
		};
		await saveSession(session);
		setBusy(false);
		await navigate({
			to: "/session/$id",
			params: { id: session.id }
		});
	}
	async function onListen(e) {
		e.preventDefault();
		const extracted = extractMeetingUrl(url) ?? normalizeUrl(url);
		const n = normalizeUrl(extracted);
		if (!isHttpUrl(n)) return;
		const meta = detectPlatform(n);
		await createAndGo({
			title: title || `${meta.label} session`,
			url: n,
			platform: meta.id,
			source: "live"
		});
	}
	async function onPasteTranscript(e) {
		e.preventDefault();
		if (notes.trim().length < 20) return;
		const extracted = url.trim() ? extractMeetingUrl(url) ?? normalizeUrl(url) : "";
		const n = extracted && isHttpUrl(extracted) ? extracted : "";
		const meta = n ? detectPlatform(n) : detectPlatform("");
		await createAndGo({
			title: title || "Pasted transcript",
			url: n,
			platform: meta.id,
			source: "transcript",
			transcriptText: notes.trim()
		});
	}
	async function onPickFile(file) {
		if (!file) return;
		const extracted = url.trim() ? extractMeetingUrl(url) ?? normalizeUrl(url) : "";
		const n = extracted && isHttpUrl(extracted) ? extracted : "";
		const meta = n ? detectPlatform(n) : detectPlatform("");
		const session = {
			id: newSessionId(),
			title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
			url: n,
			platform: meta.id,
			status: "setup",
			createdAt: Date.now(),
			durationMs: 0,
			transcriptText: "",
			segments: [],
			screenshots: [],
			notes: "",
			source: "upload",
			language
		};
		fileHandoff.set(session.id, file);
		await saveSession(session);
		await navigate({
			to: "/session/$id",
			params: { id: session.id }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "relative overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-brand"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.18em] text-brand uppercase",
						children: "Meeting notes, finished"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-6xl",
						children: ["Paste a meeting link.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "italic",
							children: " Leave with a briefing."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 max-w-xl text-base text-muted-foreground sm:text-lg",
						children: "Zoom, Google Meet, Teams, or any other call. Debrief listens to the session, then writes a PDF of the purpose, every topic explained, screenshots, spoken links, and the full transcript."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						className: "mt-10 max-w-2xl rounded-2xl p-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-xl bg-card p-4 sm:p-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
								defaultValue: "link",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
										className: "w-full sm:w-auto",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "link",
												className: "flex-1 sm:flex-none",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-3.5" }), "Link"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "file",
												className: "flex-1 sm:flex-none",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileAudio, { className: "size-3.5" }), "Recording"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "notes",
												className: "flex-1 sm:flex-none",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5" }), "Transcript"]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "link",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
											onSubmit: onListen,
											className: "flex flex-col gap-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col gap-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "meeting-url",
															children: "Meeting link"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "meeting-url",
															inputMode: "url",
															autoComplete: "off",
															placeholder: "https://meet.google.com/abc-defg-hij",
															value: url,
															onChange: (e) => applyUrl(e.target.value),
															onPaste: (e) => {
																const text = e.clipboardData.getData("text");
																const found = extractMeetingUrl(text);
																if (found && text.trim() !== found) {
																	e.preventDefault();
																	setUrl(found);
																}
															},
															required: true
														}),
														platform ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-xs text-muted-foreground",
															children: [
																"Detected ",
																platform.label,
																". Join as usual, then share that tab — with audio — so Debrief can hear it. No bot enters the call."
															]
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-muted-foreground",
															children: "Paste a Zoom invite, a Meet link, or the whole calendar blurb — the meeting URL is pulled out automatically."
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-4 sm:grid-cols-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex flex-col gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "meeting-title",
															children: "Title (optional)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "meeting-title",
															placeholder: "Q3 launch sync",
															value: title,
															onChange: (e) => setTitle(e.target.value)
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSelect, {
														id: "meeting-lang",
														value: language,
														onChange: setLanguage
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													type: "submit",
													size: "lg",
													disabled: busy || !url.trim(),
													children: ["Start listening", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "file",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col gap-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Already have the recording? Drop audio or video. Debrief transcribes it — including long files, split automatically — and builds the same PDF."
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-4 sm:grid-cols-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex flex-col gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "meeting-title-file",
															children: "Title (optional)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "meeting-title-file",
															placeholder: "Weekly standup",
															value: title,
															onChange: (e) => setTitle(e.target.value)
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSelect, {
														id: "meeting-lang-file",
														value: language,
														onChange: setLanguage
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "meeting-url-file",
														children: "Meeting link (optional)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "meeting-url-file",
														inputMode: "url",
														placeholder: "https://zoom.us/j/…",
														value: url,
														onChange: (e) => applyUrl(e.target.value)
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDrop, {
													accept: "audio/*,video/mp4,video/webm,video/quicktime",
													label: "Drop a file, or tap to choose",
													hint: "MP3, WAV, M4A, WEBM, MP4",
													onFile: (file) => void onPickFile(file)
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "notes",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
											onSubmit: onPasteTranscript,
											className: "flex flex-col gap-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-4 sm:grid-cols-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex flex-col gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "meeting-title-notes",
															children: "Title (optional)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "meeting-title-notes",
															placeholder: "Design review",
															value: title,
															onChange: (e) => setTitle(e.target.value)
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSelect, {
														id: "meeting-lang-notes",
														value: language,
														onChange: setLanguage
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "paste",
														children: "Paste what was said"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
														id: "paste",
														placeholder: "Paste a transcript, chat export, or your own notes…",
														value: notes,
														onChange: (e) => setNotes(e.target.value)
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													type: "submit",
													size: "lg",
													disabled: busy || notes.trim().length < 20,
													children: ["Build briefing", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
												})
											]
										})
									})
								]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex flex-wrap items-center gap-x-5 gap-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "outline",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/brief/$id",
									params: { id: SAMPLE_SESSION_ID },
									children: "Open a sample briefing"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#how",
								className: "inline-flex h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
								children: "How listening works"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Sessions stay on this device. Audio is sent for transcription only when you listen or upload."
							})
						]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "border-y border-border bg-paper-deep/40",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-5 sm:px-6",
				children: PLATFORM_LABELS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow-[var(--shadow-border)]",
					children: p.label
				}, p.id))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "how",
			className: "mx-auto grid max-w-6xl scroll-mt-20 gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6",
			children: [
				{
					n: "01",
					t: "Open the meeting",
					d: "Paste the Zoom, Meet, or Teams link. Join as you normally would — Debrief never sits in the participant list."
				},
				{
					n: "02",
					t: "Share the tab — or this mic",
					d: "Share that tab’s audio and screen from your browser, or listen from this microphone if the call is on a phone. Words are captured as they are said; slides are snapped when the picture changes."
				},
				{
					n: "03",
					t: "Download the PDF",
					d: "When you stop, you get purpose, topics with explanations, screenshots, links, and the full transcript — so you can decide in thirty seconds whether the rest is worth reading."
				}
			].map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs tracking-widest text-brand",
						children: step.n
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-2xl",
						children: step.t
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: step.d
					})
				]
			}, step.n))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "border-t border-border bg-card/40",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4",
				children: [
					{
						t: "Purpose, in plain language",
						d: "Why the meeting happened, written so you can decide in thirty seconds whether the rest is worth reading."
					},
					{
						t: "Every topic, explained",
						d: "Not a dump of captions. Each subject is taught the way someone would explain it after the call."
					},
					{
						t: "Screens that mattered",
						d: "When the shared slide or whiteboard changes, Debrief keeps a frame. You can pin one yourself, or attach a screenshot later."
					},
					{
						t: "Links and the full record",
						d: "Every URL spoken or pasted, plus the complete transcript, bound into one PDF."
					}
				].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-xl",
						children: item.t
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: item.d
					})]
				}, item.t))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto max-w-6xl px-4 py-14 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-3xl",
				children: "A few honest limits"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-8 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-medium",
						children: "No bot joins the call"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: "Zoom and Meet do not let a website sit in the room by itself. You join. Debrief listens from the tab you share, or from this microphone."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-medium",
						children: "Share tab audio"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: "In Chrome or Edge, pick the meeting tab and turn on “Share tab audio”. Without that, the PDF has nothing to explain."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-medium",
						children: "Stays on this device"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: "Sessions are saved in this browser. Audio is sent only to write the transcript and the briefing — not stored as a library of calls."
					})] })
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			id: "archive",
			className: "mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-3xl",
					children: "Archive"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Sessions stay on this device."
				})] }), sessions.length > 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					"aria-label": "Search archive",
					placeholder: "Search by title",
					value: query,
					onChange: (e) => setQuery(e.target.value),
					className: "sm:max-w-64"
				}) : null]
			}), filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: sessions.length === 0 ? "No sessions yet." : "Nothing matches that search."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-3",
				children: filtered.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: s.status === "ready" ? "/brief/$id" : "/session/$id",
					params: { id: s.id },
					className: cn("flex items-center justify-between gap-4 rounded-xl bg-card px-4 py-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-medium",
							children: s.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 truncate text-sm text-muted-foreground",
							children: [platformLabel(s.platform), s.durationMs ? ` · ${formatDuration(s.durationMs)}` : ""]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: s.status === "ready" ? "brand" : "default",
						children: s.status === "ready" ? "Briefing" : s.status === "listening" ? "Listening" : s.status === "processing" ? "Writing" : s.source === "sample" ? "Sample" : "Open"
					})]
				}) }, s.id))
			})]
		})
	] }) });
}
function LanguageSelect({ id, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: "Language"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
			id,
			className: selectClass,
			value,
			onChange: (e) => onChange(e.target.value),
			children: SESSION_LANGUAGES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: l.id,
				children: l.label
			}, l.id))
		})]
	});
}
//#endregion
export { Home as component };
