import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, FileAudio, FileText, Link2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FileDrop } from "@/components/file-drop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { fileHandoff } from "@/lib/meetings/handoff";
import { extractMeetingUrl } from "@/lib/meetings/invite";
import { SESSION_LANGUAGES } from "@/lib/meetings/languages";
import {
  PLATFORM_LABELS,
  detectPlatform,
  isHttpUrl,
  normalizeUrl,
  platformLabel,
} from "@/lib/meetings/platforms";
import { newSessionId, saveSession } from "@/lib/meetings/storage";
import { SAMPLE_SESSION_ID, type MeetingSession } from "@/lib/meetings/types";
import { useSessions } from "@/lib/meetings/use-sessions";
import { cn, formatDuration } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const selectClass =
  "flex h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-[var(--shadow-border)] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none";

function Home() {
  const navigate = useNavigate();
  const { sessions } = useSessions();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const platform = useMemo(() => {
    const n = normalizeUrl(url);
    return isHttpUrl(n) ? detectPlatform(n) : null;
  }, [url]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const hay = `${s.title} ${platformLabel(s.platform)} ${s.url}`.toLowerCase();
      return hay.includes(q);
    });
  }, [sessions, query]);

  function applyUrl(value: string) {
    const found = extractMeetingUrl(value);
    if (found && value.trim().length > found.length + 8) {
      setUrl(found);
      return;
    }
    setUrl(value);
  }

  async function createAndGo(
    partial: Pick<MeetingSession, "title" | "url" | "platform" | "source"> & {
      transcriptText?: string;
    },
  ) {
    setBusy(true);
    const session: MeetingSession = {
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
      language,
    };
    await saveSession(session);
    setBusy(false);
    await navigate({ to: "/session/$id", params: { id: session.id } });
  }

  async function onListen(e: FormEvent) {
    e.preventDefault();
    const extracted = extractMeetingUrl(url) ?? normalizeUrl(url);
    const n = normalizeUrl(extracted);
    if (!isHttpUrl(n)) return;
    const meta = detectPlatform(n);
    await createAndGo({
      title: title || `${meta.label} session`,
      url: n,
      platform: meta.id,
      source: "live",
    });
  }

  async function onPasteTranscript(e: FormEvent) {
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
      transcriptText: notes.trim(),
    });
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    const extracted = url.trim() ? extractMeetingUrl(url) ?? normalizeUrl(url) : "";
    const n = extracted && isHttpUrl(extracted) ? extracted : "";
    const meta = n ? detectPlatform(n) : detectPlatform("");
    const session: MeetingSession = {
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
      language,
    };
    fileHandoff.set(session.id, file);
    await saveSession(session);
    await navigate({ to: "/session/$id", params: { id: session.id } });
  }

  return (
    <AppShell>
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-brand"
          />
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
            <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
              Meeting notes, finished
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-6xl">
              Paste a meeting link.
              <span className="italic"> Leave with a briefing.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Zoom, Google Meet, Teams, or any other call. Debrief listens to the
              session, then writes a PDF of the purpose, every topic explained,
              screenshots, spoken links, and the full transcript.
            </p>

            <Card className="mt-10 max-w-2xl rounded-2xl p-2">
              <div className="rounded-xl bg-card p-4 sm:p-6">
                <Tabs defaultValue="link">
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="link" className="flex-1 sm:flex-none">
                      <Link2 className="size-3.5" />
                      Link
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex-1 sm:flex-none">
                      <FileAudio className="size-3.5" />
                      Recording
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1 sm:flex-none">
                      <FileText className="size-3.5" />
                      Transcript
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="link">
                    <form onSubmit={onListen} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="meeting-url">Meeting link</Label>
                        <Input
                          id="meeting-url"
                          inputMode="url"
                          autoComplete="off"
                          placeholder="https://meet.google.com/abc-defg-hij"
                          value={url}
                          onChange={(e) => applyUrl(e.target.value)}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData("text");
                            const found = extractMeetingUrl(text);
                            if (found && text.trim() !== found) {
                              e.preventDefault();
                              setUrl(found);
                            }
                          }}
                          required
                        />
                        {platform ? (
                          <p className="text-xs text-muted-foreground">
                            Detected {platform.label}. Join as usual, then share that
                            tab — with audio — so Debrief can hear it. No bot enters
                            the call.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Paste a Zoom invite, a Meet link, or the whole calendar
                            blurb — the meeting URL is pulled out automatically.
                          </p>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="meeting-title">Title (optional)</Label>
                          <Input
                            id="meeting-title"
                            placeholder="Q3 launch sync"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                        <LanguageSelect id="meeting-lang" value={language} onChange={setLanguage} />
                      </div>
                      <Button type="submit" size="lg" disabled={busy || !url.trim()}>
                        Start listening
                        <ArrowRight className="size-4" />
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="file">
                    <div className="flex flex-col gap-4">
                      <p className="text-sm text-muted-foreground">
                        Already have the recording? Drop audio or video. Debrief
                        transcribes it — including long files, split automatically —
                        and builds the same PDF.
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="meeting-title-file">Title (optional)</Label>
                          <Input
                            id="meeting-title-file"
                            placeholder="Weekly standup"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                        <LanguageSelect
                          id="meeting-lang-file"
                          value={language}
                          onChange={setLanguage}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="meeting-url-file">Meeting link (optional)</Label>
                        <Input
                          id="meeting-url-file"
                          inputMode="url"
                          placeholder="https://zoom.us/j/…"
                          value={url}
                          onChange={(e) => applyUrl(e.target.value)}
                        />
                      </div>
                      <FileDrop
                        accept="audio/*,video/mp4,video/webm,video/quicktime"
                        label="Drop a file, or tap to choose"
                        hint="MP3, WAV, M4A, WEBM, MP4"
                        onFile={(file) => void onPickFile(file)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="notes">
                    <form onSubmit={onPasteTranscript} className="flex flex-col gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="meeting-title-notes">Title (optional)</Label>
                          <Input
                            id="meeting-title-notes"
                            placeholder="Design review"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                        <LanguageSelect
                          id="meeting-lang-notes"
                          value={language}
                          onChange={setLanguage}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="paste">Paste what was said</Label>
                        <Textarea
                          id="paste"
                          placeholder="Paste a transcript, chat export, or your own notes…"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={busy || notes.trim().length < 20}
                      >
                        Build briefing
                        <ArrowRight className="size-4" />
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Button asChild variant="outline">
                <Link to="/brief/$id" params={{ id: SAMPLE_SESSION_ID }}>
                  Open a sample briefing
                </Link>
              </Button>
              <a
                href="#how"
                className="inline-flex h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                How listening works
              </a>
              <p className="text-xs text-muted-foreground">
                Sessions stay on this device. Audio is sent for transcription only
                when you listen or upload.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-paper-deep/40">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-5 sm:px-6">
            {PLATFORM_LABELS.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow-[var(--shadow-border)]"
              >
                {p.label}
              </span>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto grid max-w-6xl scroll-mt-20 gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6">
          {[
            {
              n: "01",
              t: "Open the meeting",
              d: "Paste the Zoom, Meet, or Teams link. Join as you normally would — Debrief never sits in the participant list.",
            },
            {
              n: "02",
              t: "Share the tab — or this mic",
              d: "Share that tab’s audio and screen from your browser, or listen from this microphone if the call is on a phone. Words are captured as they are said; slides are snapped when the picture changes.",
            },
            {
              n: "03",
              t: "Download the PDF",
              d: "When you stop, you get purpose, topics with explanations, screenshots, links, and the full transcript — so you can decide in thirty seconds whether the rest is worth reading.",
            },
          ].map((step) => (
            <div key={step.n} className="flex flex-col gap-2">
              <p className="font-mono text-xs tracking-widest text-brand">{step.n}</p>
              <h2 className="font-serif text-2xl">{step.t}</h2>
              <p className="text-sm text-muted-foreground">{step.d}</p>
            </div>
          ))}
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {[
              {
                t: "Purpose, in plain language",
                d: "Why the meeting happened, written so you can decide in thirty seconds whether the rest is worth reading.",
              },
              {
                t: "Every topic, explained",
                d: "Not a dump of captions. Each subject is taught the way someone would explain it after the call.",
              },
              {
                t: "Screens that mattered",
                d: "When the shared slide or whiteboard changes, Debrief keeps a frame. You can pin one yourself, or attach a screenshot later.",
              },
              {
                t: "Links and the full record",
                d: "Every URL spoken or pasted, plus the complete transcript, bound into one PDF.",
              },
            ].map((item) => (
              <div key={item.t} className="flex flex-col gap-2">
                <h2 className="font-serif text-xl">{item.t}</h2>
                <p className="text-sm text-muted-foreground">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-serif text-3xl">A few honest limits</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="font-medium">No bot joins the call</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Zoom and Meet do not let a website sit in the room by itself. You
                join. Debrief listens from the tab you share, or from this
                microphone.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Share tab audio</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                In Chrome or Edge, pick the meeting tab and turn on “Share tab
                audio”. Without that, the PDF has nothing to explain.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Stays on this device</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sessions are saved in this browser. Audio is sent only to write
                the transcript and the briefing — not stored as a library of
                calls.
              </p>
            </div>
          </div>
        </section>

        <section id="archive" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-3xl">Archive</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sessions stay on this device.
              </p>
            </div>
            {sessions.length > 2 ? (
              <Input
                aria-label="Search archive"
                placeholder="Search by title"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="sm:max-w-64"
              />
            ) : null}
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {sessions.length === 0 ? "No sessions yet." : "Nothing matches that search."}
            </p>
          ) : (
            <ul className="grid gap-3">
              {filtered.map((s) => (
                <li key={s.id}>
                  <Link
                    to={s.status === "ready" ? "/brief/$id" : "/session/$id"}
                    params={{ id: s.id }}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-xl bg-card px-4 py-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.title}</p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {platformLabel(s.platform)}
                        {s.durationMs ? ` · ${formatDuration(s.durationMs)}` : ""}
                      </p>
                    </div>
                    <Badge variant={s.status === "ready" ? "brand" : "default"}>
                      {s.status === "ready"
                        ? "Briefing"
                        : s.status === "listening"
                          ? "Listening"
                          : s.status === "processing"
                            ? "Writing"
                            : s.source === "sample"
                              ? "Sample"
                              : "Open"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}

function LanguageSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Language</Label>
      <select
        id={id}
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {SESSION_LANGUAGES.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
