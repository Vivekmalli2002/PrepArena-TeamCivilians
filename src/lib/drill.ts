/** 60-day drill sheet: one theme a day, 4 MUST questions as the daily core (STRETCH +2 optional, RESERVE for spare time). */
export interface DrillState {
  /** dayKey (YYYY-MM-DD) on which Day 1 was started; null until the student starts the plan. */
  start: string | null;
  /** question key "d<day>-<n>" → time it was ticked as written. */
  done: Record<string, number>;
}

export type Tier = "must" | "stretch" | "reserve";
export interface DrillQ { n: number; tier: Tier; tag: string; q: string }
export interface DrillDay {
  day: number; paper: number; rank: number; theme: string; recurrence: string; slot: string; ab: string;
  reading: { years: string; q: string }[]; other: string; expected: DrillQ[];
}

export const qKey = (day: number, n: number) => `d${day}-${n}`;

export function toggleDrill(s: DrillState, key: string): DrillState {
  const done = { ...s.done };
  if (done[key]) delete done[key];
  else done[key] = Date.now();
  return { ...s, done };
}

/** Which day of the plan it is today (1–60), by calendar days since the start date; 1 before starting. */
export function planDay(start: string | null, today: string, total = 60): number {
  if (!start) return 1;
  const a = Date.parse(start + "T00:00:00Z"), b = Date.parse(today + "T00:00:00Z");
  return Math.min(total, Math.max(1, Math.round((b - a) / 86400000) + 1));
}

export function dayProgress(day: DrillDay, done: Record<string, number>) {
  const core = day.expected.filter((e) => e.tier === "must");
  const n = core.filter((e) => done[qKey(day.day, e.n)]).length;
  return { done: n, total: core.length, all: day.expected.filter((e) => done[qKey(day.day, e.n)]).length };
}

/** Consecutive finished days (all 4 MUST ticked) counting back from the last finished one at or before `upTo`. */
export function streak(days: DrillDay[], done: Record<string, number>, upTo: number): number {
  let n = 0;
  for (let d = upTo; d >= 1; d--) {
    const p = dayProgress(days[d - 1], done);
    if (p.done === p.total) n++;
    else if (d !== upTo) break;
  }
  return n;
}
