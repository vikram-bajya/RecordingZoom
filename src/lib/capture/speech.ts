export type SpeechHandlers = {
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  onError?: (message: string) => void;
};

export function speechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startSpeechRecognition(
  lang: string,
  handlers: SpeechHandlers,
): { stop: () => void } {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) {
    handlers.onError?.("Live captions need Chrome or Edge.");
    return { stop: () => undefined };
  }

  let stopped = false;
  let rec: SpeechRecognition | null = null;

  const attach = () => {
    if (stopped) return;
    const r = new Ctor();
    rec = r;
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang || "en-US";
    r.maxAlternatives = 1;

    r.onresult = (ev) => {
      let interim = "";
      let finals = "";
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const res = ev.results[i];
        const piece = res?.[0]?.transcript ?? "";
        if (res?.isFinal) finals += `${piece} `;
        else interim += piece;
      }
      const f = finals.trim();
      if (f) handlers.onFinal(f);
      handlers.onInterim(interim.trim());
    };

    r.onerror = (ev) => {
      if (ev.error === "no-speech" || ev.error === "aborted") return;
      if (ev.error === "not-allowed") {
        handlers.onError?.(
          "Microphone permission was blocked. Share the meeting tab and include audio.",
        );
      }
    };

    r.onend = () => {
      if (!stopped) {
        try {
          attach();
        } catch {
          /* browser may throttle restarts */
        }
      }
    };

    try {
      r.start();
    } catch {
      /* already started */
    }
  };

  attach();

  return {
    stop: () => {
      stopped = true;
      try {
        rec?.abort();
      } catch {
        /* ignore */
      }
      rec = null;
    },
  };
}
