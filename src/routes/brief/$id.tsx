import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Copy,
  Download,
  Eye,
  FileText,
  ImagePlus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MAX_SCREENSHOTS, fileToJpegDataUrl } from "@/lib/capture/media";
import { produceBrief } from "@/lib/meetings/produce-brief";
import { platformLabel } from "@/lib/meetings/platforms";
import { removeSession, saveSession } from "@/lib/meetings/storage";
import { briefingMarkdown } from "@/lib/meetings/to-markdown";
import { downloadBriefPdf, openBriefPdf } from "@/lib/pdf/generate";
import type { Screenshot } from "@/lib/meetings/types";
import { useSession } from "@/lib/meetings/use-sessions";
import { formatDuration } from "@/lib/utils";

export const Route = createFileRoute("/brief/$id")({
  component: BriefPage,
});

function BriefPage() {
  const { id } = Route.useParams();
  const { session, ready } = useSession(id);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [query, setQuery] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  const brief = session?.brief;
  const filteredSegments = useMemo(() => {
    if (!session) return [];
    const q = query.trim().toLowerCase();
    if (!q) return session.segments;
    return session.segments.filter((s) => {
      const hay = `${s.speaker ?? ""} ${s.text}`.toLowerCase();
      return hay.includes(q);
    });
  }, [session, query]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground">
          Loading briefing…
        </main>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="font-serif text-3xl">Briefing not found</h1>
          <Button asChild className="mt-6">
            <Link to="/">Back home</Link>
          </Button>
        </main>
      </AppShell>
    );
  }

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
        caption: captions[i] ?? s.caption,
      }));
      await saveSession({ ...current, brief: nextBrief, screenshots, status: "ready" });
      toast.success("Briefing rewritten");
    } catch {
      toast.error("Could not rewrite the briefing.");
    } finally {
      setRewriting(false);
    }
  }

  async function onAttach(file: File | undefined) {
    if (!file) return;
    if (current.screenshots.length >= MAX_SCREENSHOTS) {
      toast.message("Screenshot limit reached for this briefing.");
      return;
    }
    const dataUrl = await fileToJpegDataUrl(file);
    if (!dataUrl) {
      toast.error("Could not read that image.");
      return;
    }
    const shot: Screenshot = {
      id: crypto.randomUUID(),
      t: current.durationMs,
      dataUrl,
      caption: file.name.replace(/\.[^.]+$/, ""),
      important: true,
    };
    await saveSession({
      ...current,
      screenshots: [...current.screenshots, shot],
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

  const when = new Date(session.startedAt ?? session.createdAt).toLocaleString(
    undefined,
    { dateStyle: "medium", timeStyle: "short" },
  );

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4" data-no-print>
          <Button variant="ghost" asChild className="-ml-3 w-fit">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Archive
            </Link>
          </Button>
          {brief ? (
            <div className="flex flex-col gap-3 rounded-xl bg-paper-deep px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">The briefing PDF is ready.</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Purpose first. If it matters, read the rest — or download everything.
                </p>
              </div>
              <Button onClick={() => void onDownload()} disabled={saving} className="shrink-0">
                <Download className="size-4" />
                {saving && !showPdf ? "Building PDF" : "Download PDF"}
              </Button>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button
              variant="outline"
              onClick={() => void onPreview()}
              disabled={saving || !brief}
            >
              <Eye className="size-4" />
              {showPdf ? "Rebuild preview" : "Preview PDF"}
            </Button>
            <Button variant="outline" onClick={() => void onCopy()} disabled={!brief}>
              <Copy className="size-4" />
              Copy
            </Button>
            <Button variant="outline" onClick={onMarkdown} disabled={!brief}>
              <FileText className="size-4" />
              Markdown
            </Button>
            <Button
              variant="outline"
              onClick={() => void onRewrite()}
              disabled={rewriting || !session.transcriptText.trim()}
            >
              <RefreshCw className="size-4" />
              {rewriting ? "Rewriting" : "Rewrite"}
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  void onAttach(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-card px-4 text-sm font-medium shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] sm:w-auto">
                <ImagePlus className="size-4" />
                Attach screen
              </span>
            </label>
            <Button variant="outline" onClick={() => void onDelete()}>
              <Trash2 className="size-4" />
              {confirmDelete ? "Confirm remove" : "Remove"}
            </Button>
          </div>
        </div>

        {showPdf && pdfUrl ? (
          <section className="mt-6" data-no-print>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">PDF preview</p>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => setShowPdf(false)}
                aria-label="Hide PDF preview"
              >
                <X className="size-4" />
              </button>
            </div>
            <iframe
              title="Briefing PDF"
              src={pdfUrl}
              className="h-[70vh] w-full rounded-xl bg-card shadow-[var(--shadow-border)]"
            />
          </section>
        ) : null}

        <article className="mt-8">
          <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
            Session briefing
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">
            {session.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {platformLabel(session.platform)} · {formatDuration(session.durationMs)} ·{" "}
            {when}
          </p>
          {session.url ? (
            <a
              href={session.url}
              className="mt-1 inline-block text-sm break-all text-brand hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {session.url}
            </a>
          ) : null}

          {!brief ? (
            <p className="mt-10 text-sm text-muted-foreground">
              This session has no briefing yet.{" "}
              <Link
                to="/session/$id"
                params={{ id: session.id }}
                className="text-brand underline-offset-4 hover:underline"
              >
                Open the session
              </Link>
              .
            </p>
          ) : (
            <>
              <section className="mt-10" id="purpose">
                <h2 className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
                  Purpose of this meeting
                </h2>
                <p className="mt-3 text-lg leading-relaxed">{brief.purpose}</p>
              </section>

              <section className="mt-8">
                <h2 className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
                  In short
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {brief.summary}
                </p>
              </section>

              {brief.participants.length > 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  {brief.participants.join(" · ")}
                </p>
              ) : null}

              <Separator className="my-10" />

              <section>
                <h2 className="font-serif text-2xl">Topics, explained</h2>
                <ol className="mt-6 grid gap-8">
                  {brief.topics.map((topic, i) => (
                    <li key={`${topic.title}-${i}`} className="grid gap-2 sm:grid-cols-[2rem_1fr]">
                      <span className="font-serif text-xl text-brand">{i + 1}</span>
                      <div>
                        <h3 className="font-serif text-xl">{topic.title}</h3>
                        <p className="mt-2 leading-relaxed text-muted-foreground">
                          {topic.explanation}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {brief.decisions.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-serif text-2xl">Decisions</h2>
                  <ul className="mt-4 grid gap-2">
                    {brief.decisions.map((d) => (
                      <li key={d} className="flex gap-3 text-sm leading-relaxed">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {brief.actionItems.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-serif text-2xl">Action items</h2>
                  <ul className="mt-4 grid gap-3">
                    {brief.actionItems.map((item) => (
                      <li
                        key={item.task}
                        className="rounded-lg bg-muted/80 px-4 py-3"
                      >
                        <p className="text-sm font-medium">{item.task}</p>
                        {item.owner || item.due ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[item.owner, item.due].filter(Boolean).join(" · ")}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {brief.quotes.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-serif text-2xl">What was said</h2>
                  <ul className="mt-4 grid gap-4">
                    {brief.quotes.map((q) => (
                      <li key={q.text} className="border-l-2 border-brand/40 pl-4">
                        {q.speaker ? (
                          <p className="text-xs font-medium tracking-wide text-brand uppercase">
                            {q.speaker}
                          </p>
                        ) : null}
                        <p className="mt-1 font-serif text-lg leading-relaxed italic">
                          {q.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {brief.links.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-serif text-2xl">Links mentioned</h2>
                  <ul className="mt-4 grid gap-3">
                    {brief.links.map((link) => (
                      <li key={link.url}>
                        <p className="text-sm text-muted-foreground">{link.context}</p>
                        <a
                          href={link.url}
                          className="text-sm break-all text-brand hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {session.notes.trim() ? (
                <section className="mt-12">
                  <h2 className="font-serif text-2xl">Listener notes</h2>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {session.notes}
                  </p>
                </section>
              ) : null}

              {session.screenshots.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-serif text-2xl">Important screens</h2>
                  <div className="mt-4 grid gap-6">
                    {session.screenshots.map((shot) => (
                      <figure key={shot.id} className="grid gap-2">
                        <img
                          src={shot.dataUrl}
                          alt={shot.caption || "Meeting screen"}
                          className="w-full rounded-lg outline outline-1 -outline-offset-1 outline-foreground/10"
                        />
                        <figcaption className="text-xs text-muted-foreground">
                          {formatDuration(shot.t)}
                          {shot.caption ? ` — ${shot.caption}` : ""}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="mt-12">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl">Full transcript</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Everything that was heard, in order.
                    </p>
                  </div>
                  <div className="flex items-center gap-2" data-no-print>
                    <Badge variant="outline">
                      {session.segments.length || (session.transcriptText ? 1 : 0)} lines
                    </Badge>
                  </div>
                </div>
                {(session.segments.length > 6 || session.transcriptText.length > 400) && (
                  <div className="mt-4" data-no-print>
                    <Input
                      aria-label="Search transcript"
                      placeholder="Search the transcript"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                )}
                <div className="mt-4 space-y-3">
                  {session.segments.length > 0 ? (
                    filteredSegments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing matches that search.</p>
                    ) : (
                      filteredSegments.map((seg) => (
                        <p key={seg.id} className="text-sm leading-relaxed">
                          <span className="mr-2 font-mono text-[11px] text-brand tabular-nums">
                            {formatDuration(seg.t)}
                          </span>
                          {seg.speaker ? (
                            <span className="mr-1 font-medium">{seg.speaker}</span>
                          ) : null}
                          {seg.text}
                        </p>
                      ))
                    )
                  ) : session.transcriptText.trim() ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {session.transcriptText}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No speech was captured in this session.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </article>
      </main>
    </AppShell>
  );
}
