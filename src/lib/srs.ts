import type { QStat } from "./types";

/**
 * Leitner-style spaced repetition for the revision set. A wrong answer puts a question in
 * box 0 (due now); each later correct answer moves it up a box and pushes the next review
 * further out. Passing the last box graduates it out of the revision set.
 */
export const INTERVAL_DAYS = [0, 1, 3, 7, 16];
const DAY = 86_400_000;

export function inRevision(s: QStat | undefined): s is QStat & { box: number } {
  return s?.box != null;
}

export function isDue(s: QStat | undefined, now = Date.now()) {
  return inRevision(s) && (s.due ?? 0) <= now;
}

/** Applies one review outcome to the SRS fields (does not touch answer counts). */
export function review(s: QStat, ok: boolean, now: number): QStat {
  if (!ok) return { ...s, box: 0, due: now };
  if (s.box == null) return s;
  const next = s.box + 1;
  if (next >= INTERVAL_DAYS.length) return { ...s, box: null, due: undefined };
  return { ...s, box: next, due: now + INTERVAL_DAYS[next] * DAY };
}

export function graduate(s: QStat): QStat {
  return { ...s, box: null, due: undefined };
}

export function dueLabel(s: QStat, now = Date.now()) {
  const d = Math.ceil(((s.due ?? 0) - now) / DAY);
  return d <= 0 ? "Due now" : d === 1 ? "Due tomorrow" : `Due in ${d} days`;
}
