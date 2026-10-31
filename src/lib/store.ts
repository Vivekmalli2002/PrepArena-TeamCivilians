"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dayKey, uid } from "./random";
import { graduate, review } from "./srs";
import type { Attempt, PaletteStatus, QStat, Question, Session, TestConfig } from "./types";

const MAX_ATTEMPTS = 300;

export type Theme = "system" | "light" | "dark";

export interface Profile {
  name: string;
  examId: string;
  createdAt: number;
}

interface AppState {
  profile: Profile | null;
  theme: Theme;
  attempts: Attempt[];
  qstats: Record<number, QStat>;
  bookmarks: number[];
  /** Days (YYYY-MM-DD) with at least one finished test — drives the streak. */
  activeDays: string[];
  installPrompt: "pending" | "eligible" | "dismissed";

  setProfile: (p: Profile) => void;
  setTheme: (t: Theme) => void;
  toggleBookmark: (id: number) => void;
  addAttempt: (a: Attempt) => void;
  /** Flashcard self-grading: moves the question through the revision boxes without counting it as a test answer. */
  rateCard: (id: number, knewIt: boolean) => void;
  /** "I've learnt this": take the question out of the revision set. */
  clearFromRevision: (id: number) => void;
  /** Replace everything with an imported backup. */
  restore: (s: Pick<AppState, "profile" | "theme" | "attempts" | "qstats" | "bookmarks" | "activeDays">) => void;
  setInstallPrompt: (s: AppState["installPrompt"]) => void;
  resetAll: () => void;
}

const initial = {
  profile: null,
  theme: "system" as Theme,
  attempts: [],
  qstats: {},
  bookmarks: [],
  activeDays: [],
  installPrompt: "pending" as const,
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setProfile: (profile) => set({ profile }),
      setTheme: (theme) => set({ theme }),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter((b) => b !== id) : [...s.bookmarks, id],
        })),
      addAttempt: (a) =>
        set((s) => {
          const qstats = { ...s.qstats };
          a.config.qids.forEach((id, i) => {
            const r = a.responses[i];
            if (r == null) return;
            const prev = qstats[id] ?? { n: 0, c: 0, last: false, at: 0 };
            const ok = r === a.key[i];
            qstats[id] = review({ ...prev, n: prev.n + 1, c: prev.c + (ok ? 1 : 0), last: ok, at: a.finishedAt }, ok, a.finishedAt);
          });
          const day = dayKey(new Date(a.finishedAt));
          return {
            attempts: [...s.attempts, a].slice(-MAX_ATTEMPTS),
            qstats,
            activeDays: s.activeDays.includes(day) ? s.activeDays : [...s.activeDays, day],
          };
        }),
      rateCard: (id, knewIt) =>
        set((s) => {
          const prev = s.qstats[id] ?? { n: 0, c: 0, last: knewIt, at: Date.now() };
          return { qstats: { ...s.qstats, [id]: review(prev, knewIt, Date.now()) } };
        }),
      clearFromRevision: (id) =>
        set((s) => (s.qstats[id] ? { qstats: { ...s.qstats, [id]: graduate(s.qstats[id]) } } : s)),
      restore: (data) => set({ ...initial, ...data, installPrompt: "dismissed" }),
      setInstallPrompt: (installPrompt) => set({ installPrompt }),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: "tc-app",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, from) => migrateApp(persisted as Record<string, unknown>, from) as unknown as AppState,
    },
  ),
);

/** v1 → v2: wrong answers enter the spaced-repetition revision set; retired exam ids are remapped. */
export function migrateApp(state: Record<string, unknown>, from: number) {
  const s = { ...state };
  if (from < 2) {
    const qstats = { ...((s.qstats as Record<number, QStat>) ?? {}) };
    for (const [id, q] of Object.entries(qstats)) if (!q.last) qstats[Number(id)] = { ...q, box: 0, due: q.at };
    s.qstats = qstats;
    const profile = s.profile as Profile | null;
    if (profile?.examId === "allied") s.profile = { ...profile, examId: "aswo" };
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Live test session — its own key, because it is written every second. */

interface SessionState {
  session: Session | null;
  start: (config: TestConfig) => void;
  begin: (patch?: Partial<Pick<TestConfig, "mode" | "schemeId">>) => void;
  tick: (deltaMs: number) => void;
  setPaused: (paused: boolean) => void;
  choose: (option: number) => void;
  goTo: (index: number) => void;
  saveNext: () => void;
  markNext: () => void;
  clear: () => void;
  restart: () => void;
  discard: () => void;
  /** Turns the session into an Attempt, records it, and returns its id. */
  submit: (byId: Map<number, Question>) => string | null;
}

function fresh(config: TestConfig): Session {
  const n = config.qids.length;
  return {
    id: uid(),
    config,
    started: false,
    current: 0,
    responses: Array(n).fill(null),
    drafts: Array(n).fill(null),
    marked: Array(n).fill(false),
    visited: Array.from({ length: n }, (_, i) => i === 0),
    qTimeMs: Array(n).fill(0),
    elapsedMs: 0,
    paused: false,
  };
}

const patch = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));

export const useSession = create<SessionState>()(
  persist(
    (set, get) => {
      /** Move to question `to`, discarding any unsaved choice on the current one (real-CBT rule). */
      const move = (s: Session, to: number): Session => {
        const next = Math.max(0, Math.min(s.config.qids.length - 1, to));
        return {
          ...s,
          drafts: patch(s.drafts, s.current, s.responses[s.current]),
          current: next,
          visited: patch(s.visited, next, true),
        };
      };
      const update = (fn: (s: Session) => Session) => {
        const s = get().session;
        if (s) set({ session: fn(s) });
      };

      return {
        session: null,
        start: (config) => set({ session: fresh(config) }),
        begin: (p) => update((s) => ({ ...s, started: true, paused: false, config: { ...s.config, ...p } })),
        tick: (d) =>
          update((s) =>
            !s.started || s.paused
              ? s
              : { ...s, elapsedMs: s.elapsedMs + d, qTimeMs: patch(s.qTimeMs, s.current, s.qTimeMs[s.current] + d) },
          ),
        setPaused: (paused) => update((s) => ({ ...s, paused })),
        choose: (o) =>
          update((s) => {
            if (s.config.mode === "practice") {
              // Practice locks the first answer and reveals the key immediately.
              if (s.responses[s.current] != null) return s;
              return { ...s, responses: patch(s.responses, s.current, o), drafts: patch(s.drafts, s.current, o) };
            }
            return { ...s, drafts: patch(s.drafts, s.current, o) };
          }),
        goTo: (i) => update((s) => move(s, i)),
        saveNext: () =>
          update((s) => {
            const saved = {
              ...s,
              responses: patch(s.responses, s.current, s.drafts[s.current]),
              marked: patch(s.marked, s.current, false),
            };
            return move(saved, s.current + 1);
          }),
        markNext: () =>
          update((s) => {
            const saved = {
              ...s,
              responses: patch(s.responses, s.current, s.drafts[s.current]),
              marked: patch(s.marked, s.current, true),
            };
            return move(saved, s.current + 1);
          }),
        clear: () =>
          update((s) =>
            s.config.mode === "practice"
              ? s
              : { ...s, drafts: patch(s.drafts, s.current, null), responses: patch(s.responses, s.current, null) },
          ),
        restart: () => update((s) => ({ ...fresh(s.config), started: true })),
        discard: () => set({ session: null }),
        submit: (byId) => {
          const s = get().session;
          if (!s) return null;
          // In exam mode an unsaved selection on the open question is not evaluated, as in the CBT.
          const attempt: Attempt = {
            id: s.id,
            config: s.config,
            finishedAt: Date.now(),
            responses: s.responses,
            marked: s.marked,
            qTimeMs: s.qTimeMs.map(Math.round),
            elapsedMs: Math.round(s.elapsedMs),
            key: s.config.qids.map((id) => byId.get(id)?.answerIndex ?? -1),
            topics: s.config.qids.map((id) => byId.get(id)?.topic ?? ""),
          };
          useApp.getState().addAttempt(attempt);
          set({ session: null });
          return attempt.id;
        },
      };
    },
    { name: "tc-session", version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export function paletteStatus(s: Session, i: number): PaletteStatus {
  if (!s.visited[i]) return "notVisited";
  const answered = s.responses[i] != null;
  if (s.marked[i]) return answered ? "answeredMarked" : "marked";
  return answered ? "answered" : "notAnswered";
}

/* ------------------------------------------------------------------ */

const noop = () => () => {};
/** False during prerender and the hydration pass, true afterwards — gate any localStorage-driven UI on it. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function currentStreak(days: string[], today = new Date()): number {
  const set = new Set(days);
  const d = new Date(today);
  // A streak survives until the end of today even if today isn't practised yet.
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
