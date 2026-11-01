import type { Countdown } from "./extras";

export interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Milliseconds left; negative once the moment has passed. */
  ms: number;
}

/** Local `YYYY-MM-DDTHH:mm` → timestamp. */
export const atMs = (c: Pick<Countdown, "at">) => new Date(c.at).getTime();

export function partsLeft(at: number, now: number): Parts {
  const ms = at - now;
  const t = Math.floor(Math.abs(ms) / 1000);
  return { days: Math.floor(t / 86400), hours: Math.floor((t % 86400) / 3600), minutes: Math.floor((t % 3600) / 60), seconds: t % 60, ms };
}

export type Tone = "over" | "urgent" | "soon" | "ok" | "done";

/** Colour band: red inside 3 days, amber inside 2 weeks, green beyond. */
export function toneOf(c: Countdown, now: number): Tone {
  if (c.done) return "done";
  const ms = atMs(c) - now;
  if (ms <= 0) return "over";
  if (ms < 3 * 86_400_000) return "urgent";
  if (ms < 14 * 86_400_000) return "soon";
  return "ok";
}

/** "84 Days", "Tomorrow", "Today", "3 h left", "Overdue 2 d". */
export function chipText(c: Countdown, now: number): string {
  if (c.done) return "Done";
  const p = partsLeft(atMs(c), now);
  if (p.ms <= 0) return p.days ? `Overdue ${p.days} d` : "Overdue";
  if (p.days >= 2) return `${p.days} Days`;
  if (p.days === 1) return "1 Day";
  return p.hours ? `${p.hours} h left` : `${p.minutes} min left`;
}

/** Share of the time between creation and the deadline that has already passed (0–1). */
export function elapsed(c: Countdown, now: number): number {
  const start = c.createdAt;
  const end = atMs(c);
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

export interface Suggestion {
  title: string;
  kind: "exam";
  at: string;
  source: string;
}

/**
 * Dates printed in the 2026 notifications (docs/notifications). Only dates that the commission has fixed are listed:
 * the Group-I screening test and the application deadlines. Exam dates still "to be intimated" are not guessed.
 * The notifications do not print a start time, so a morning time is pre-filled and can be edited.
 */
export const SUGGESTIONS: Suggestion[] = [
  { title: "Group-1 Prelims (Screening Test)", kind: "exam", at: "2027-01-24T09:00", source: "Notification 07/2026, para 1.7" },
  { title: "Draughtsman Gr-II — last date to apply", kind: "exam", at: "2026-11-05T23:59", source: "Notification 15/2026" },
  { title: "Endowment EO Gr-III — last date to apply", kind: "exam", at: "2026-11-05T23:59", source: "Notification 23/2026" },
  { title: "AEE (Civil / Mech) — last date to apply", kind: "exam", at: "2026-11-22T23:59", source: "Brief Notification 27/2026" },
  { title: "Group-2 — last date to apply", kind: "exam", at: "2026-11-30T23:59", source: "Brief Notification 37/2026" },
];

/** Sensible default for a new item: tomorrow, 9 am. */
export function defaultAt(now = Date.now()) {
  const d = new Date(now + 86_400_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T09:00`;
}
