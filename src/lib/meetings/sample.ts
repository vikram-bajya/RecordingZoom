import { SAMPLE_SESSION_ID, type MeetingSession, type Screenshot } from "./types";

function slide(title: string, lines: string[], accent = "#3f5368"): string {
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

  return canvas.toDataURL("image/jpeg", 0.72);
}

export function buildSampleScreenshots(): Screenshot[] {
  if (typeof document === "undefined") return [];
  return [
    {
      id: "ss-1",
      t: 4 * 60 * 1000,
      important: true,
      caption: "Launch window locked to the week of October 14.",
      dataUrl: slide("Atlas Search — Q3 launch", [
        "Public beta      week of 14 Oct",
        "GA               4 Nov",
        "Docs freeze      30 Sep",
        "Pricing page     ships with beta",
      ]),
    },
    {
      id: "ss-2",
      t: 18 * 60 * 1000,
      important: true,
      caption: "API shape: POST /v1/search with filters on collection and recency.",
      dataUrl: slide("Search API v1", [
        "POST /v1/search",
        "query, collection, recency_days",
        "Response: hits[], next_cursor",
        "Rate limit: 60 req / min / key",
      ], "#2f5d45"),
    },
    {
      id: "ss-3",
      t: 31 * 60 * 1000,
      important: true,
      caption: "Starter free tier plus Team at $29 / seat. Enterprise later.",
      dataUrl: slide("Pricing hypothesis", [
        "Starter     free · 2k queries / mo",
        "Team        $29 / seat / mo",
        "Usage over  $8 / extra 10k queries",
        "Enterprise  conversation next quarter",
      ], "#9a3b2a"),
    },
  ];
}

const TRANSCRIPT = `Priya: Thanks everyone for joining. The purpose of this meeting is to lock the Atlas Search launch plan for Q3, agree the API surface, and decide how we talk about pricing on the public page.

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

export function createSampleSession(): MeetingSession {
  const createdAt = Date.now() - 1000 * 60 * 60 * 26;
  return {
    id: SAMPLE_SESSION_ID,
    title: "Atlas Search — Q3 launch sync",
    url: "https://meet.google.com/abc-defg-hij",
    platform: "meet",
    status: "ready",
    createdAt,
    startedAt: createdAt + 60_000,
    endedAt: createdAt + 60_000 + 38 * 60_000,
    durationMs: 38 * 60_000,
    transcriptText: TRANSCRIPT,
    notes: "Watch for the docs freeze on 30 Sep. Pricing page must ship with beta.",
    segments: TRANSCRIPT.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, i) => {
        const idx = line.indexOf(":");
        const speaker = idx > 0 && idx < 18 ? line.slice(0, idx) : undefined;
        const text = speaker ? line.slice(idx + 1).trim() : line;
        return {
          id: `seg-${i}`,
          t: i * 90_000,
          speaker,
          text,
        };
      }),
    screenshots: [],
    brief: {
      purpose:
        "Lock the Atlas Search Q3 launch plan: dates, the v1 API surface, public pricing, and owners for docs and the pricing page.",
      summary:
        "The team committed to a public beta the week of 14 October and GA on 4 November, with a docs freeze on 30 September. Search ships as a single POST /v1/search endpoint. Public pricing is Starter (free) and Team ($29/seat); Enterprise stays off the website. Jordan drafts the pricing page, Marcus reviews docs, Lina updates the spec.",
      topics: [
        {
          title: "Launch timeline",
          explanation:
            "Engineering can hit public beta the week of 14 October if documentation freezes on 30 September. General availability is 4 November. If work slips, the announcement slips — the quality bar does not.",
        },
        {
          title: "Search API v1",
          explanation:
            "A single endpoint, POST /v1/search, with query, collection, and recency_days in the body. Responses return hits and a next_cursor. Collection filters are exact-match only for beta; fuzzy collection names wait for v1.1. Rate limits: 20 req/min on Starter, 60 on Team.",
        },
        {
          title: "Pricing on the public page",
          explanation:
            "Starter is free with 2,000 queries per month. Team is $29 per seat per month, with overage at $8 per extra 10,000 queries. No public Enterprise price — that number would be screenshotted and used in negotiations. Sales handles Enterprise privately.",
        },
        {
          title: "Owners and hiring",
          explanation:
            "Jordan (marketing) drafts pricing-page copy by Friday. Marcus reviews the help article Monday. Lina writes rate limits into the spec today and will intro two search-engineer referrals. One search-engineer req is already open.",
        },
      ],
      decisions: [
        "Public beta the week of 14 October; GA on 4 November; docs freeze 30 September.",
        "Ship one endpoint: POST /v1/search. Fuzzy collection filters are not in beta.",
        "Public pricing is Starter + Team only. No Enterprise price on the website.",
        "Announcement slips before quality does.",
      ],
      actionItems: [
        {
          owner: "Lina",
          task: "Write rate limits into the search spec and share the Figma for the results page.",
          due: "Today",
        },
        {
          owner: "Jordan",
          task: "First draft of the public pricing page copy.",
          due: "Friday",
        },
        {
          owner: "Marcus",
          task: "Review the help article at docs.atlas.dev/search/start and send the incident runbook.",
          due: "Monday",
        },
        {
          owner: "Lina",
          task: "Intro two search-engineer referrals to the recruiter.",
          due: "This week",
        },
      ],
      links: [
        {
          url: "https://github.com/atlas-labs/search-spec",
          context: "Draft API spec for POST /v1/search",
        },
        {
          url: "https://www.figma.com/file/atlas-search-results",
          context: "Results page design",
        },
        {
          url: "https://docs.google.com/document/d/atlas-search-pricing",
          context: "Finance one-pager for pricing",
        },
        {
          url: "https://docs.atlas.dev/search/start",
          context: "Public help article to review",
        },
        {
          url: "https://notion.so/atlas-search-runbook",
          context: "Incident runbook Marcus will send",
        },
      ],
      quotes: [
        {
          speaker: "Priya",
          text: "If something slips, we slip the announcement, not the quality bar.",
        },
        {
          speaker: "Marcus",
          text: "I do not want a public Enterprise number. It always gets screenshot and used against us.",
        },
      ],
      participants: ["Priya", "Marcus", "Lina", "Jordan"],
    },
    source: "sample",
    language: "en",
  };
}
