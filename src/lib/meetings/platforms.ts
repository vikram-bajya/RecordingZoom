import type { PlatformId } from "./types";

export type PlatformMeta = {
  id: PlatformId;
  label: string;
};

const RULES: Array<{ id: PlatformId; label: string; test: RegExp }> = [
  { id: "zoom", label: "Zoom", test: /zoom\.(us|com)/i },
  { id: "meet", label: "Google Meet", test: /meet\.google\.com/i },
  { id: "teams", label: "Microsoft Teams", test: /(teams\.microsoft\.com|teams\.live\.com)/i },
  { id: "webex", label: "Webex", test: /webex\.com/i },
  { id: "discord", label: "Discord", test: /(discord\.com|discord\.gg)/i },
  { id: "slack", label: "Slack", test: /app\.slack\.com/i },
  { id: "jitsi", label: "Jitsi", test: /meet\.jit\.si/i },
  { id: "whereby", label: "Whereby", test: /whereby\.com/i },
  { id: "around", label: "Around", test: /around\.co/i },
  { id: "goto", label: "GoTo Meeting", test: /(gotomeeting\.com|meet\.goto\.com)/i },
];

export const PLATFORM_LABELS: Array<{ id: PlatformId; label: string }> = [
  { id: "zoom", label: "Zoom" },
  { id: "meet", label: "Google Meet" },
  { id: "teams", label: "Microsoft Teams" },
  { id: "webex", label: "Webex" },
  { id: "discord", label: "Discord" },
  { id: "slack", label: "Slack" },
  { id: "jitsi", label: "Jitsi" },
  { id: "whereby", label: "Whereby" },
  { id: "around", label: "Around" },
  { id: "goto", label: "GoTo Meeting" },
  { id: "other", label: "Any browser call" },
];

export function detectPlatform(url: string): PlatformMeta {
  for (const rule of RULES) {
    if (rule.test.test(url)) return { id: rule.id, label: rule.label };
  }
  return { id: "other", label: "Meeting" };
}

export function platformLabel(id: PlatformId): string {
  return PLATFORM_LABELS.find((r) => r.id === id)?.label ?? "Meeting";
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
