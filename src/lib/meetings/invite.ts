import { isHttpUrl, normalizeUrl } from "./platforms";

const MEETING_HOST =
  /https?:\/\/[^\s<>)"']*(?:zoom\.(?:us|com)|meet\.google\.com|teams\.microsoft\.com|teams\.live\.com|webex\.com|discord\.(?:com|gg)|app\.slack\.com|meet\.jit\.si|whereby\.com|around\.co|gotomeeting\.com|meet\.goto\.com)[^\s<>)"']*/i;

const ANY_URL = /https?:\/\/[^\s<>)"']+/i;

export function extractMeetingUrl(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const meeting = t.match(MEETING_HOST)?.[0];
  if (meeting) return stripTrail(meeting);
  if (isHttpUrl(t) || isHttpUrl(normalizeUrl(t))) {
    const n = normalizeUrl(t.split(/\s+/)[0] ?? t);
    if (isHttpUrl(n) && n.length < 2000) return n;
  }
  const any = t.match(ANY_URL)?.[0];
  return any ? stripTrail(any) : null;
}

function stripTrail(url: string): string {
  return url.replace(/[.,;:]+$/g, "");
}
