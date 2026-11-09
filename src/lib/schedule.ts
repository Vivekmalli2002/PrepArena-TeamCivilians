/**
 * Group-I Mains day-wise checklist (the "PYQ recurrence" plan): 60 days, one dossier theme a day (two a day at the end), with
 * rewrite sprints on days 49-54. The learner reads the day's past questions and expected questions in the offline booklet and
 * ticks them here; ticks are stored in the app state (`sched`: key → time) so progress survives restarts and is part of the backup.
 */
import data from "@/content/mains-schedule.json";

export interface ExpectedQ {
  n: number;
  topic: string;
  q: string;
  chance: string;
}
export interface ReserveQ {
  n: number;
  q: string;
  chance: string;
}
export interface ScheduleTheme {
  title: string;
  paper: string;
  pyqs: number;
  cycles: string;
  top: ExpectedQ[];
  more: ReserveQ[];
}
export type Phase = "A" | "B" | "R" | "D";
export interface ScheduleDay {
  day: number;
  /** YYYY-MM-DD */
  date: string;
  label: string;
  phase: Phase;
  themes: ScheduleTheme[];
}

export const DAYS = data.days as unknown as ScheduleDay[];
export const PHASES = data.phases as Record<Phase, string>;
export const PHASE_ORDER: Phase[] = ["A", "B", "R", "D"];

/** Keys of the items that count towards a day's progress. */
export function itemKeys(d: ScheduleDay): string[] {
  if (!d.themes.length) return [`d${d.day}.rw`];
  return d.themes.flatMap((_, i) => [`d${d.day}.t${i}.pyq`, ...[1, 2, 3, 4, 5].map((n) => `d${d.day}.t${i}.q${n}`)]);
}
/** Optional extras (the "next 7" reserve questions): never counted, but can be ticked. */
export function reserveKeys(d: ScheduleDay): string[] {
  return d.themes.flatMap((t, i) => t.more.map((m) => `d${d.day}.t${i}.r${m.n}`));
}

export interface Progress {
  done: number;
  total: number;
}
export const dayProgress = (d: ScheduleDay, sched: Record<string, number>): Progress => {
  const keys = itemKeys(d);
  return { done: keys.filter((k) => sched[k]).length, total: keys.length };
};
export const totalProgress = (days: ScheduleDay[], sched: Record<string, number>): Progress =>
  days.reduce((p, d) => {
    const x = dayProgress(d, sched);
    return { done: p.done + x.done, total: p.total + x.total };
  }, { done: 0, total: 0 });
export const dayDone = (d: ScheduleDay, sched: Record<string, number>) => {
  const p = dayProgress(d, sched);
  return p.total > 0 && p.done === p.total;
};

/** The plan day for a calendar date: null before the plan starts, the last day after it ends. */
export function planDay(todayKey: string): ScheduleDay | null {
  if (todayKey < DAYS[0].date) return null;
  return DAYS.find((d) => d.date === todayKey) ?? DAYS[DAYS.length - 1];
}

/** The first day (from the start) that is not finished — where "Continue" takes the learner. */
export function firstUnfinished(sched: Record<string, number>): ScheduleDay | null {
  return DAYS.find((d) => !dayDone(d, sched)) ?? null;
}

/** Days before `today` that are not finished. */
export const pendingBefore = (todayKey: string, sched: Record<string, number>) =>
  DAYS.filter((d) => d.date < todayKey && !dayDone(d, sched));
