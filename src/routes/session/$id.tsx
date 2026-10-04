import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  ExternalLink,
  LoaderCircle,
  Mic,
  MonitorUp,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { FileDrop } from "@/components/file-drop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  LIVE_CHUNK_MS,
  MAX_SCREENSHOTS,
  fileToJpegDataUrl,
  framesFromVideoFile,
  frameToJpeg,
  grabImageData,
  sceneScore,
  startDisplayCapture,
  startLevelMonitor,
  startMicCapture,
  type CaptureHandle,
} from "@/lib/capture/media";
import { speechLang } from "@/lib/meetings/languages";
import { speechSupported, startSpeechRecognition } from "@/lib/capture/speech";
import { fileHandoff } from "@/lib/meetings/handoff";
import { platformLabel } from "@/lib/meetings/platforms";
import { produceBrief, transcribeFile } from "@/lib/meetings/produce-brief";
import { saveSession } from "@/lib/meetings/storage";
import type { MeetingSession, Screenshot, TranscriptSegment } from "@/lib/meetings/types";
import { useSession } from "@/lib/meetings/use-sessions";
import { formatClock, formatDuration, isEmbeddedBrowser } from "@/lib/utils";

export const Route = createFileRoute("/session/$id")({
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const { session, ready } = useSession(id);
  const navigate = useNavigate();
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState("");
  const [progress, setProgress] = useState(12);
  const [previewOn, setPreviewOn] = useState(false);
  const [notes, setNotes] = useState("");
  const [level, setLevel] = useState(0);
  const [captureKind, setCaptureKind] = useState<"display" | "mic" | null>(null);
  const [embedded, setEmbedded] = useState(false);
  const [sttPending, setSttPending] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureRef = useRef<CaptureHandle | null>(null);
  const speechRef = useRef<{ stop: () => void } | null>(null);
  const meterRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<number | null>(null);
  const shotTimerRef = useRef<number | null>(null);
  const lastFrameRef = useRef<ImageData | null>(null);
  const lastShotRef = useRef(0);
  const startedRef = useRef(false);
  const sttChain = useRef(Promise.resolve());
  const chunkStartRef = useRef(0);
  const usedStt = useRef(false);
  const interruptToast = useRef(false);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<MeetingSession | undefined>(session);
  sessionRef.current = session;

  useEffect(() => {
    if (session && !notes) setNotes(session.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  useEffect(() => {
    setEmbedded(isEmbeddedBrowser());
  }, []);

  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [session?.segments.length, interim]);

  useEffect(() => {
    if (!session) return;

    if (session.status === "listening" && !captureRef.current) {
      void patch({ status: "setup" });
      if (!interruptToast.current) {
        interruptToast.current = true;
        toast.message("Listening was interrupted. Start again to continue.");
      }
      return;
    }

    if (startedRef.current) return;

    const file = fileHandoff.get(session.id);
    if (file) {
      startedRef.current = true;
      fileHandoff.delete(session.id);
      void handleUpload(session, file);
      return;
    }
    if (
      session.source === "transcript" &&
      session.transcriptText.trim() &&
      session.status === "setup"
    ) {
      startedRef.current = true;
      void finishBrief(session, { durationMs: 0 });
      return;
    }
    if (session.status === "processing" && session.transcriptText.trim()) {
      startedRef.current = true;
      void finishBrief(session, {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    return () => {
      void teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session?.status !== "listening") return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [session?.status]);

  async function patch(update: Partial<MeetingSession>) {
    const current = sessionRef.current;
    if (!current) return current;
    const next = { ...current, ...update };
    sessionRef.current = next;
    await saveSession(next);
    return next;
  }

  async function teardown() {
    speechRef.current?.stop();
    speechRef.current = null;
    meterRef.current?.();
    meterRef.current = null;
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (shotTimerRef.current) window.clearInterval(shotTimerRef.current);
    timerRef.current = null;
    shotTimerRef.current = null;
    if (wakeLockRef.current) {
      await wakeLockRef.current.release().catch(() => undefined);
      wakeLockRef.current = null;
    }
    if (captureRef.current) {
      await captureRef.current.stop().catch(() => null);
      captureRef.current = null;
    }
    setPreviewOn(false);
    setCaptureKind(null);
  }

  function takeShot(important: boolean) {
    const handle = captureRef.current;
    const current = sessionRef.current;
    if (!handle || !current) return;
    if (current.screenshots.length >= MAX_SCREENSHOTS) {
      toast.message("Screenshot limit reached for this session.");
      return;
    }
    const jpeg = frameToJpeg(handle.video, important ? 0.65 : 0.55, important ? 1100 : 960);
    if (!jpeg) return;
    const shot: Screenshot = {
      id: crypto.randomUUID(),
      t: Date.now() - (current.startedAt ?? Date.now()),
      dataUrl: jpeg,
      important,
    };
    lastShotRef.current = Date.now();
    void patch({ screenshots: [...current.screenshots, shot] });
  }

  async function attachImage(file: File) {
    const current = sessionRef.current;
    if (!current) return;
    if (current.screenshots.length >= MAX_SCREENSHOTS) {
      toast.message("Screenshot limit reached for this session.");
      return;
    }
    const dataUrl = await fileToJpegDataUrl(file);
    if (!dataUrl) {
      toast.error("Could not read that image.");
      return;
    }
    const shot: Screenshot = {
      id: crypto.randomUUID(),
      t: Date.now() - (current.startedAt ?? current.createdAt),
      dataUrl,
      caption: file.name.replace(/\.[^.]+$/, ""),
      important: true,
    };
    await patch({ screenshots: [...current.screenshots, shot] });
    toast.success("Screenshot attached");
  }

  function removeShot(id: string) {
    const current = sessionRef.current;
    if (!current) return;
    void patch({ screenshots: current.screenshots.filter((s) => s.id !== id) });
  }

  function enqueueStt(blob: Blob) {
    const chunkStarted = chunkStartRef.current;
    chunkStartRef.current = Date.now();
    const startedAt = sessionRef.current?.startedAt ?? chunkStarted;
    const t0 = Math.max(0, chunkStarted - startedAt);
    setSttPending((n) => n + 1);
    sttChain.current = sttChain.current.then(async () => {
      const live = sessionRef.current;
      if (!live) return;
      try {
        const stt = await transcribeFile(blob, live.language || "en", t0);
        if (!stt.ok || !stt.text) return;
        const firstStt = !usedStt.current;
        usedStt.current = true;
        const latest = sessionRef.current;
        if (!latest) return;
        const incoming = stt.segments ?? [];
        const segs = (firstStt ? incoming : [...latest.segments, ...incoming]).sort(
          (a, b) => a.t - b.t,
        );
        await patch({
          segments: segs,
          transcriptText:
            segs.map((s) => s.text).join(" ").trim() ||
            (firstStt ? stt.text : `${latest.transcriptText} ${stt.text}`.trim()),
        });
      } catch {
        /* keep listening even if one chunk fails */
      } finally {
        setSttPending((n) => Math.max(0, n - 1));
      }
    });
  }

  async function beginCapture(kind: "display" | "mic") {
    const current = sessionRef.current;
    if (!current) return;
    try {
      if (kind === "display" && current.url) {
        window.open(current.url, "_blank", "noopener,noreferrer");
      }
      const handle =
        kind === "display"
          ? await startDisplayCapture({
              chunkMs: LIVE_CHUNK_MS,
              onAudioChunk: (blob) => enqueueStt(blob),
            })
          : await startMicCapture({
              chunkMs: LIVE_CHUNK_MS,
              onAudioChunk: (blob) => enqueueStt(blob),
            });
      captureRef.current = handle;
      setCaptureKind(kind);
      if (kind === "display" && videoRef.current) {
        videoRef.current.srcObject = handle.stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setPreviewOn(true);

      const audioTracks = handle.stream.getAudioTracks();
      if (audioTracks.length === 0) {
        toast.message(
          kind === "display" ? "Share tab audio is off" : "No microphone audio",
          {
            description:
              kind === "display"
                ? "In the browser picker, choose the meeting tab and enable audio."
                : "Allow microphone access so the session can be written down.",
          },
        );
      }

      meterRef.current?.();
      meterRef.current = startLevelMonitor(handle.stream, setLevel);

      try {
        wakeLockRef.current = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        wakeLockRef.current = null;
      }

      handle.stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        void stopListening();
      });
      handle.stream.getAudioTracks()[0]?.addEventListener("ended", () => {
        if (kind === "mic") void stopListening();
      });

      const startedAt = Date.now();
      chunkStartRef.current = startedAt;
      usedStt.current = false;
      await patch({
        status: "listening",
        startedAt,
        source: "live",
      });
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - startedAt);
      }, 250);

      // Tab audio is transcribed from the shared stream. Web Speech uses the
      // microphone, so it is only a live caption for mic listening.
      if (kind === "mic" && speechSupported()) {
        speechRef.current = startSpeechRecognition(speechLang(current.language), {
          onFinal: (text) => {
            if (usedStt.current) {
              setInterim("");
              return;
            }
            const live = sessionRef.current;
            if (!live) return;
            const seg: TranscriptSegment = {
              id: crypto.randomUUID(),
              t: Date.now() - (live.startedAt ?? Date.now()),
              text,
            };
            void patch({
              segments: [...live.segments, seg],
              transcriptText: `${live.transcriptText} ${text}`.trim(),
            });
            setInterim("");
          },
          onInterim: setInterim,
          onError: (message) => toast.error(message),
        });
      } else if (kind === "display") {
        toast.message("Captions appear as the shared tab audio is transcribed.");
      }

      if (kind === "display") {
        window.setTimeout(() => takeShot(true), 1800);
        shotTimerRef.current = window.setInterval(() => {
          const video = captureRef.current?.video;
          if (!video) return;
          const frame = grabImageData(video);
          if (!frame) return;
          const { score, next } = sceneScore(lastFrameRef.current, frame);
          lastFrameRef.current = next;
          if (score > 0.11 && Date.now() - lastShotRef.current > 18_000) {
            takeShot(true);
          }
        }, 1400);
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") {
        toast.error(
          kind === "display"
            ? "Screen share was cancelled. Choose the meeting tab and include audio."
            : "Microphone permission was blocked.",
        );
      } else {
        toast.error("Could not start capture in this browser.");
      }
    }
  }

  async function stopListening() {
    const current = sessionRef.current;
    if (!current || current.status !== "listening") {
      await teardown();
      return;
    }
    const durationMs = Date.now() - (current.startedAt ?? Date.now());
    setStep("Saving the last of the audio");
    setProgress(30);
    speechRef.current?.stop();
    speechRef.current = null;
    meterRef.current?.();
    meterRef.current = null;
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (shotTimerRef.current) window.clearInterval(shotTimerRef.current);
    if (wakeLockRef.current) {
      await wakeLockRef.current.release().catch(() => undefined);
      wakeLockRef.current = null;
    }
    if (captureRef.current) {
      await captureRef.current.stop();
      captureRef.current = null;
    }
    setPreviewOn(false);
    setCaptureKind(null);
    await sttChain.current.catch(() => undefined);

    const next = await patch({
      status: "processing",
      endedAt: Date.now(),
      durationMs,
      notes,
    });
    if (!next) return;
    await finishBrief(next, { durationMs, notes });
  }

  async function handleUpload(current: MeetingSession, file: File) {
    await patch({ status: "processing", startedAt: Date.now() });
    setStep("Transcribing the recording");
    setProgress(40);
    const stt = await transcribeFile(file, current.language || "en", 0, (label, value) => {
      setStep(label);
      setProgress(value);
    });
    if (!stt.ok || !stt.text) {
      await patch({
        status: "error",
        error: stt.error ?? "Could not transcribe that file.",
      });
      toast.error(stt.error ?? "Could not transcribe that file.");
      startedRef.current = false;
      return;
    }
    let shots: Screenshot[] = current.screenshots;
    if (file.type.startsWith("video/")) {
      setStep("Pulling key frames");
      setProgress(62);
      const frames = await framesFromVideoFile(file, 4);
      shots = [
        ...shots,
        ...frames.map((dataUrl, i) => ({
          id: `frame-${i}`,
          t: i * 60_000,
          dataUrl,
          important: true,
        })),
      ].slice(0, MAX_SCREENSHOTS);
    }
    const next = await patch({
      transcriptText: stt.text,
      segments: stt.segments ?? [],
      screenshots: shots,
      durationMs: stt.durationMs || Math.round((stt.segments?.at(-1)?.t ?? 0) || 0),
    });
    if (next) await finishBrief(next, {});
  }

  async function finishBrief(
    current: MeetingSession,
    extras: Partial<MeetingSession>,
  ) {
    startedRef.current = true;
    const working = { ...current, ...extras, notes: extras.notes ?? notes, status: "processing" as const };
    sessionRef.current = working;
    await saveSession(working);
    if (!working.transcriptText.trim()) {
      await patch({
        status: "error",
        error:
          "No speech was captured. Share the meeting tab with audio, listen from the microphone, or paste a transcript.",
      });
      toast.error("No speech was captured.");
      startedRef.current = false;
      return;
    }
    setStep("Explaining the topics");
    setProgress(78);
    const { brief, captions } = await produceBrief(working);
    const screenshots = working.screenshots.map((s, i) => ({
      ...s,
      caption: captions[i] ?? s.caption,
    }));
    const readySession: MeetingSession = {
      ...working,
      status: "ready",
      brief,
      screenshots,
      endedAt: working.endedAt ?? Date.now(),
    };
    sessionRef.current = readySession;
    await saveSession(readySession);
    setProgress(100);
    await navigate({ to: "/brief/$id", params: { id: readySession.id } });
  }

  async function retryBrief() {
    const current = sessionRef.current;
    if (!current?.transcriptText.trim()) return;
    startedRef.current = true;
    await finishBrief(current, {});
  }

  if (!ready) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground">
          Loading session…
        </main>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="font-serif text-3xl">Session not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been cleared from this device.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back home</Link>
          </Button>
        </main>
      </AppShell>
    );
  }

  const listening = session.status === "listening";
  const processing = session.status === "processing";

  return (
    <AppShell>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
              {platformLabel(session.platform)}
            </p>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl">{session.title}</h1>
            {session.url ? (
              <a
                href={session.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex h-11 items-center gap-1.5 text-sm text-brand hover:underline"
              >
                Open meeting
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>

          {embedded && !listening && !processing ? (
            <div className="rounded-xl bg-paper-deep px-4 py-3 text-sm">
              <p className="font-medium">Screen sharing works best in its own window.</p>
              <p className="mt-1 text-muted-foreground">
                Open the listener in a new tab, then share the meeting tab from there.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => window.open(window.location.href, "_blank", "noopener")}
              >
                Open listener in a new tab
              </Button>
            </div>
          ) : null}

          <Card className="overflow-hidden rounded-xl p-2">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-primary">
              <video
                ref={videoRef}
                className={`h-full w-full object-cover ${previewOn && captureKind === "display" ? "opacity-100" : "opacity-0"}`}
                muted
                playsInline
              />
              {previewOn && captureKind === "mic" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-primary-foreground">
                  <p className="font-serif text-2xl">Listening from this microphone</p>
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-primary-foreground/15">
                    <div
                      className="h-full rounded-full bg-primary-foreground transition-[width] duration-150"
                      style={{ width: `${Math.max(6, Math.round(level * 100))}%` }}
                    />
                  </div>
                  <p className="max-w-sm text-sm text-primary-foreground/70">
                    Place this device near the speaker. Attach screenshots below if
                    you want slides in the PDF.
                  </p>
                </div>
              ) : null}
              {!previewOn ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-primary-foreground">
                  <p className="font-serif text-2xl">Waiting to listen</p>
                  <p className="max-w-sm text-sm text-primary-foreground/70">
                    Share the meeting tab — not this page — and turn on tab audio, or
                    listen from this microphone if the call is on another device.
                  </p>
                </div>
              ) : null}
              {listening ? (
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-live">
                  <span className="size-1.5 animate-pulse rounded-full bg-live" />
                  Listening
                </div>
              ) : null}
              {listening && captureKind === "display" ? (
                <div className="absolute right-3 bottom-3 left-3">
                  <div className="h-1 overflow-hidden rounded-full bg-primary-foreground/20">
                    <div
                      className="h-full rounded-full bg-primary-foreground transition-[width] duration-150"
                      style={{ width: `${Math.max(4, Math.round(level * 100))}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-3xl tracking-tight tabular-nums">
              {formatClock(listening ? elapsed : session.durationMs)}
            </p>
            {listening ? (
              <>
                <Button variant="live" onClick={() => void stopListening()}>
                  <Square className="size-3.5 fill-current" />
                  Stop and write PDF
                </Button>
                {captureKind === "display" ? (
                  <Button variant="outline" onClick={() => takeShot(true)}>
                    <Camera className="size-4" />
                    Keep this screen
                  </Button>
                ) : null}
              </>
            ) : processing ? (
              <Badge variant="brand">Writing the briefing</Badge>
            ) : session.status === "error" ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-destructive">{session.error}</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void beginCapture("display")}>
                    Try sharing the tab
                  </Button>
                  <Button variant="outline" onClick={() => void beginCapture("mic")}>
                    Try the microphone
                  </Button>
                  {session.transcriptText.trim() ? (
                    <Button variant="outline" onClick={() => void retryBrief()}>
                      Write briefing from what we have
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void beginCapture("display")}>
                  <MonitorUp className="size-4" />
                  Share meeting tab
                </Button>
                <Button variant="outline" onClick={() => void beginCapture("mic")}>
                  <Mic className="size-4" />
                  Listen from microphone
                </Button>
              </div>
            )}
          </div>

          {processing ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                {step || "Working"}
              </div>
              <Progress value={progress} />
            </div>
          ) : null}

          {!listening && !processing && session.status !== "error" ? (
            <ol className="grid gap-2 text-sm text-muted-foreground">
              <li>1. Join the meeting in another tab (Open meeting above).</li>
              <li>2. Click Share meeting tab and pick that tab — not this page.</li>
              <li>3. Enable “Share tab audio” in the picker.</li>
              <li>4. Or use the microphone if the call is on a phone sitting nearby.</li>
              <li>5. When the call ends, stop — the PDF is written for you.</li>
            </ol>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="session-notes">Your notes (optional)</Label>
            <Textarea
              id="session-notes"
              className="min-h-24"
              placeholder="Names, a link you spotted, anything you want in the PDF…"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                void patch({ notes: e.target.value });
              }}
              disabled={processing}
            />
          </div>

          {!processing ? (
            <FileDrop
              accept="image/*,video/mp4,video/webm"
              label="Attach a screenshot"
              hint="Drop a slide, photo, or short clip to keep in the PDF"
              onFile={(file) => void attachImage(file)}
              className="min-h-20"
            />
          ) : null}

          {session.screenshots.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {session.screenshots.map((s) => (
                <div key={s.id} className="relative shrink-0">
                  <img
                    src={s.dataUrl}
                    alt={s.caption || `Screen at ${formatDuration(s.t)}`}
                    className="h-16 w-28 rounded-sm object-cover outline outline-1 -outline-offset-1 outline-foreground/10"
                  />
                  {!processing ? (
                    <button
                      type="button"
                      aria-label="Remove screenshot"
                      className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-background/90 text-foreground"
                      onClick={() => removeShot(s.id)}
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="flex min-h-80 flex-col rounded-xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl">Live transcript</h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {session.segments.length} lines
              {sttPending > 0 ? " · transcribing" : ""}
            </p>
          </div>
          <div ref={transcriptRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
            {session.segments.length === 0 && !interim ? (
              <p className="text-sm text-muted-foreground">
                Words appear here as they are spoken. After the session they are
                grouped into topics and a downloadable PDF.
              </p>
            ) : null}
            {session.segments.map((seg) => (
              <p key={seg.id} className="text-sm leading-relaxed">
                <span className="mr-2 font-mono text-[11px] text-brand tabular-nums">
                  {formatDuration(seg.t)}
                </span>
                {seg.speaker ? (
                  <span className="mr-1 font-medium">{seg.speaker}</span>
                ) : null}
                {seg.text}
              </p>
            ))}
            {interim ? (
              <p className="text-sm text-muted-foreground italic">{interim}</p>
            ) : null}
            {sttPending > 0 && listening ? (
              <p className="text-xs text-muted-foreground">Writing the latest audio…</p>
            ) : null}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
