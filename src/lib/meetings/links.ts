const URL_RE = /\bhttps?:\/\/[^\s<>)"']+/gi;

const KNOWN_HOST =
  /(?:https?:\/\/)?(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org|figma\.com|notion\.so|notion\.site|docs\.google\.com|drive\.google\.com|sheets\.google\.com|dropbox\.com|atlassian\.net|linear\.app|vercel\.app|netlify\.app|trello\.com|asana\.com|miro\.com|lucid\.app|canva\.com|slack\.com|docs\.[a-z0-9.-]+\.[a-z]{2,})[^\s<>)"']*/gi;

const SPOKEN_DOMAIN =
  /\b(?:[a-z0-9-]+\.)+(?:com|org|net|dev|io|app|co|ai|so|us|in)(?:\/[^\s<>)"']*)?/gi;

export function extractUrls(text: string): string[] {
  const found = [
    ...(text.match(URL_RE) ?? []),
    ...(text.match(KNOWN_HOST) ?? []),
    ...(text.match(SPOKEN_DOMAIN) ?? []),
  ];
  const cleaned = found.map((u) => {
    const trimmed = u.replace(/[.,;:]+$/, "");
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  });
  return [...new Set(cleaned)].filter((u) => {
    try {
      const host = new URL(u).hostname;
      if (!host.includes(".")) return false;
      if (/^(www\.)?localhost$/i.test(host)) return false;
      return true;
    } catch {
      return false;
    }
  });
}
