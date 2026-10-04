import { useEffect, useSyncExternalStore } from "react";
import {
  getHydratedSnapshot,
  getSession,
  getSessionsSnapshot,
  hydrateSessions,
  subscribeSessions,
} from "./storage";
import type { MeetingSession } from "./types";

const EMPTY_SESSIONS: MeetingSession[] = [];

export function useSessions() {
  const sessions = useSyncExternalStore(
    subscribeSessions,
    getSessionsSnapshot,
    () => EMPTY_SESSIONS,
  );
  const ready = useSyncExternalStore(
    subscribeSessions,
    getHydratedSnapshot,
    () => false,
  );

  useEffect(() => {
    void hydrateSessions();
  }, []);

  return { sessions, ready };
}

export function useSession(id: string | undefined) {
  const { sessions, ready } = useSessions();
  if (!id) return { session: undefined, ready };
  const fromList = sessions.find((s) => s.id === id);
  if (fromList) return { session: fromList, ready };
  if (!ready) return { session: undefined, ready };
  try {
    return { session: getSession(id), ready };
  } catch {
    return { session: undefined, ready };
  }
}
