import { createSampleSession, buildSampleScreenshots } from "./sample";
import { SAMPLE_SESSION_ID, type MeetingSession } from "./types";

const DB_NAME = "debrief-sessions";
const STORE = "sessions";
const DB_VERSION = 1;

let memory: MeetingSession[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeSessions(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSessionsSnapshot(): MeetingSession[] {
  return memory;
}

export function getHydratedSnapshot(): boolean {
  return hydrated;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("storage timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function idbAll(): Promise<MeetingSession[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as MeetingSession[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(session: MeetingSession): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function sortSessions(list: MeetingSession[]): MeetingSession[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

function normalize(session: MeetingSession): MeetingSession {
  return {
    ...session,
    notes: session.notes ?? "",
    screenshots: session.screenshots ?? [],
    segments: session.segments ?? [],
    brief: session.brief
      ? {
          ...session.brief,
          quotes: session.brief.quotes ?? [],
          participants: session.brief.participants ?? [],
        }
      : session.brief,
  };
}

function makeSample(withShots: boolean): MeetingSession {
  const sample = createSampleSession();
  if (!withShots) return sample;
  try {
    sample.screenshots = buildSampleScreenshots();
  } catch {
    sample.screenshots = [];
  }
  return sample;
}

export async function hydrateSessions(): Promise<void> {
  if (typeof window === "undefined") return;
  if (hydrated) return;

  const fallback = makeSample(false);
  memory = [fallback];
  hydrated = true;
  emit();

  try {
    fallback.screenshots = makeSample(true).screenshots;
    emit();
  } catch {
    /* screenshots are decorative */
  }

  try {
    const stored = await withTimeout(idbAll(), 2000);
    if (stored.length === 0) {
      await idbPut(fallback).catch(() => undefined);
      return;
    }
    const next = sortSessions(stored.map(normalize));
    const sample = next.find((s) => s.id === SAMPLE_SESSION_ID);
    if (sample && sample.screenshots.length === 0) {
      sample.screenshots = fallback.screenshots;
      await idbPut(sample).catch(() => undefined);
    }
    memory = next;
    emit();
  } catch {
    /* keep the in-memory sample */
  }
}

export function getSession(id: string): MeetingSession | undefined {
  return memory.find((s) => s.id === id);
}

export async function saveSession(session: MeetingSession): Promise<void> {
  const normalized = normalize(session);
  const idx = memory.findIndex((s) => s.id === normalized.id);
  if (idx >= 0) memory[idx] = normalized;
  else memory = [normalized, ...memory];
  memory = sortSessions(memory);
  emit();
  try {
    await withTimeout(idbPut(normalized), 2000);
  } catch {
    // Quota or private mode — keep working from memory.
  }
}

export async function removeSession(id: string): Promise<void> {
  memory = memory.filter((s) => s.id !== id);
  emit();
  try {
    await withTimeout(idbDelete(id), 2000);
  } catch {
    /* ignore */
  }
}

export function newSessionId(): string {
  return crypto.randomUUID();
}
