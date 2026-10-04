export type PlatformId =
  | "zoom"
  | "meet"
  | "teams"
  | "webex"
  | "discord"
  | "slack"
  | "jitsi"
  | "whereby"
  | "around"
  | "goto"
  | "other";

export type SessionStatus =
  | "setup"
  | "listening"
  | "processing"
  | "ready"
  | "error";

export type SessionSource = "live" | "upload" | "transcript" | "sample";

export type TranscriptSegment = {
  id: string;
  t: number;
  speaker?: string;
  text: string;
};

export type Screenshot = {
  id: string;
  t: number;
  dataUrl: string;
  caption?: string;
  important?: boolean;
};

export type BriefTopic = {
  title: string;
  explanation: string;
};

export type ActionItem = {
  task: string;
  owner?: string;
  due?: string;
};

export type MentionedLink = {
  url: string;
  context: string;
};

export type BriefQuote = {
  text: string;
  speaker?: string;
};

export type MeetingBrief = {
  purpose: string;
  summary: string;
  topics: BriefTopic[];
  decisions: string[];
  actionItems: ActionItem[];
  links: MentionedLink[];
  quotes: BriefQuote[];
  participants: string[];
};

export type MeetingSession = {
  id: string;
  title: string;
  url: string;
  platform: PlatformId;
  status: SessionStatus;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  durationMs: number;
  transcriptText: string;
  segments: TranscriptSegment[];
  screenshots: Screenshot[];
  brief?: MeetingBrief;
  notes: string;
  source: SessionSource;
  error?: string;
  language: string;
};

export const SAMPLE_SESSION_ID = "sample-atlas-q3";
