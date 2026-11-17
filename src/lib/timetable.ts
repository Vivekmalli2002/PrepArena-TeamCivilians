/**
 * Daily timetable: the same full-day study plan for every date from 18 Nov 2026 to 31 Dec 2026, in two flavours (a normal day
 * from 7:30 AM, or an early start from 5:00 AM). Both flavours carry the same seven study blocks, so a tick belongs to the date
 * and the block, not to the flavour. Ticks live in the app state (`tt`: "YYYY-MM-DD.BLOCK" → time) and are part of the backup.
 */
import { dateDone, daysBetween, keyOf, planDayOn } from "./calendar";

export const TT_START = "2026-11-18";
export const TT_END = "2026-12-31";

export type Mode = "N" | "E";
export type BlockKey = "SOM" | "ASWO" | "MA" | "EVS" | "PRE" | "PCB" | "CA";

export const SUBJECTS: Record<BlockKey, { name: string; color: string; icon: string }> = {
  SOM: { name: "SOM classes", color: "#7c3aed", icon: "🏗️" },
  ASWO: { name: "ASWO", color: "#db2777", icon: "📘" },
  MA: { name: "Mental Ability", color: "#ea580c", icon: "🧠" },
  EVS: { name: "Environmental Science", color: "#059669", icon: "🌿" },
  PRE: { name: "Prelims Subjects", color: "#0284c7", icon: "📚" },
  PCB: { name: "PCB & PR Extra", color: "#ca8a04", icon: "📝" },
  CA: { name: "Current Affairs", color: "#4f46e5", icon: "📰" },
};
export const BLOCK_KEYS = Object.keys(SUBJECTS) as BlockKey[];

export const MEALS = {
  BF: { name: "Breakfast", icon: "🥣", note: "" },
  LU: { name: "Lunch break", icon: "🍛", note: "" },
  TEA: { name: "Evening tea & snacks", icon: "☕", note: "Tea · snacks · short walk" },
  DIN: { name: "Night dinner", icon: "🍲", note: "" },
} as const;

export type Slot =
  | { t: "study"; start: string; end: string; key: BlockKey }
  | { t: "meal"; start: string; end: string; key: keyof typeof MEALS }
  | { t: "break"; start: string; end: string; label: string }
  | { t: "end"; start: string; label: string };

export const PLANS: Record<Mode, Slot[]> = {
  N: [
    { t: "meal", start: "07:00", end: "07:30", key: "BF" },
    { t: "study", start: "07:30", end: "10:30", key: "SOM" },
    { t: "break", start: "10:30", end: "10:45", label: "Short break · water & stretch" },
    { t: "study", start: "10:45", end: "12:45", key: "ASWO" },
    { t: "meal", start: "12:45", end: "13:30", key: "LU" },
    { t: "study", start: "13:30", end: "15:00", key: "EVS" },
    { t: "study", start: "15:00", end: "17:00", key: "MA" },
    { t: "meal", start: "17:00", end: "18:00", key: "TEA" },
    { t: "study", start: "18:00", end: "19:30", key: "PRE" },
    { t: "break", start: "19:30", end: "19:45", label: "Short break · eyes off screen" },
    { t: "study", start: "19:45", end: "20:45", key: "CA" },
    { t: "meal", start: "20:45", end: "21:30", key: "DIN" },
    { t: "study", start: "21:30", end: "23:00", key: "PCB" },
    { t: "end", start: "23:00", label: "🌙 Day done at 11:00 PM — sleep soon" },
  ],
  E: [
    { t: "study", start: "05:00", end: "07:00", key: "ASWO" },
    { t: "meal", start: "07:00", end: "07:30", key: "BF" },
    { t: "study", start: "07:30", end: "10:30", key: "SOM" },
    { t: "break", start: "10:30", end: "10:45", label: "Short break · water & stretch" },
    { t: "study", start: "10:45", end: "12:45", key: "MA" },
    { t: "meal", start: "12:45", end: "13:30", key: "LU" },
    { t: "study", start: "13:30", end: "15:00", key: "EVS" },
    { t: "break", start: "15:00", end: "15:15", label: "Short break · stretch" },
    { t: "study", start: "15:15", end: "16:45", key: "PRE" },
    { t: "break", start: "16:45", end: "17:00", label: "Freshen up" },
    { t: "meal", start: "17:00", end: "18:00", key: "TEA" },
    { t: "study", start: "18:00", end: "19:00", key: "CA" },
    { t: "study", start: "19:00", end: "20:30", key: "PCB" },
    { t: "meal", start: "20:30", end: "21:15", key: "DIN" },
    { t: "end", start: "21:15", label: "🌙 Free time / light revision · sleep by 10 PM (early start tomorrow)" },
  ],
};
export const MODE_LABEL: Record<Mode, { title: string; sub: string; window: string }> = {
  N: { title: "☀️ Normal day", sub: "7:30 AM – 11 PM", window: "7:00a–11p" },
  E: { title: "🌅 Early start", sub: "5:00 AM – 9 PM", window: "5:00a–9:15p" },
};

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
export const fmtHours = (min: number) => `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ""}`;

/** Minutes planned for each subject block (identical in both flavours). */
export const BLOCK_MINUTES = Object.fromEntries(
  BLOCK_KEYS.map((k) => {
    const s = PLANS.N.find((x): x is Extract<Slot, { t: "study" }> => x.t === "study" && x.key === k)!;
    return [k, toMin(s.end) - toMin(s.start)];
  }),
) as Record<BlockKey, number>;
export const DAY_MINUTES = BLOCK_KEYS.reduce((a, k) => a + BLOCK_MINUTES[k], 0);

export const ttKey = (date: string, k: BlockKey) => `${date}.${k}`;
export const inRange = (date: string) => date >= TT_START && date <= TT_END;

/** Every date of the timetable, 18 Nov to 31 Dec. */
export const TT_DATES: string[] = (() => {
  const out: string[] = [];
  const n = daysBetween(TT_START, TT_END);
  const [y, m, d] = TT_START.split("-").map(Number);
  for (let i = 0; i <= n; i++) {
    const t = new Date(Date.UTC(y, m - 1, d + i));
    out.push(keyOf(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
  }
  return out;
})();

export interface DayStats {
  blocks: number;
  done: number;
  planned: number;
  doneMin: number;
  complete: boolean;
}
export function dayStats(date: string, tt: Record<string, number>): DayStats {
  const ticked = BLOCK_KEYS.filter((k) => tt[ttKey(date, k)]);
  return {
    blocks: BLOCK_KEYS.length,
    done: ticked.length,
    planned: DAY_MINUTES,
    doneMin: ticked.reduce((a, k) => a + BLOCK_MINUTES[k], 0),
    complete: ticked.length === BLOCK_KEYS.length,
  };
}
export const ttComplete = (date: string, tt: Record<string, number>) => inRange(date) && dayStats(date, tt).complete;

export interface Overall {
  days: number;
  /** Days that have begun (today counts), fully finished days, and begun days before today that are not finished. */
  begun: number;
  complete: number;
  behind: string[];
  /** Consecutive finished days ending today (or yesterday while today is still open). */
  streak: number;
  doneMin: number;
  /** Minutes that were due by today, and the whole period's minutes. */
  dueMin: number;
  totalMin: number;
  bySubject: Record<BlockKey, { done: number; total: number }>;
  state: "before" | "running" | "over";
  daysLeft: number;
}
export function overall(today: string, tt: Record<string, number>): Overall {
  const state = today < TT_START ? "before" : today > TT_END ? "over" : "running";
  const begun = TT_DATES.filter((d) => d <= today);
  const complete = TT_DATES.filter((d) => ttComplete(d, tt)).length;
  const behind = begun.filter((d) => d < today && !ttComplete(d, tt));
  let streak = 0;
  for (let i = begun.length - 1; i >= 0; i--) {
    const d = begun[i];
    if (ttComplete(d, tt)) streak++;
    else if (d === today) continue;
    else break;
  }
  const bySubject = Object.fromEntries(BLOCK_KEYS.map((k) => [k, { done: 0, total: BLOCK_MINUTES[k] * TT_DATES.length }])) as Overall["bySubject"];
  let doneMin = 0;
  for (const d of TT_DATES)
    for (const k of BLOCK_KEYS)
      if (tt[ttKey(d, k)]) {
        doneMin += BLOCK_MINUTES[k];
        bySubject[k].done += BLOCK_MINUTES[k];
      }
  return {
    days: TT_DATES.length,
    begun: begun.length,
    complete,
    behind,
    streak,
    doneMin,
    dueMin: begun.length * DAY_MINUTES,
    totalMin: TT_DATES.length * DAY_MINUTES,
    bySubject,
    state,
    daysLeft: state === "over" ? 0 : Math.max(0, daysBetween(today < TT_START ? TT_START : today, TT_END) + 1),
  };
}

/** The date to show first: today while the timetable runs, otherwise its first or last day. */
export const defaultDate = (today: string) => (today < TT_START ? TT_START : today > TT_END ? TT_END : today);

export interface CellStatus {
  /** The date carries a Mains plan day, a timetable day, or both. */
  applicable: boolean;
  /** Everything that applies on the date is finished. */
  done: boolean;
  /** Past, applicable and not finished. */
  late: boolean;
  /** Share of the timetable's study time ticked (0 when the date has no timetable). */
  ttShare: number;
}
export function cellStatus(date: string, today: string, sched: Record<string, number>, marked: Record<string, number>, tt: Record<string, number>): CellStatus {
  const hasPlan = !!planDayOn(date);
  const hasTT = inRange(date);
  const applicable = hasPlan || hasTT;
  const done = applicable && (!hasPlan || dateDone(date, sched, marked)) && (!hasTT || ttComplete(date, tt));
  const st = hasTT ? dayStats(date, tt) : null;
  return { applicable, done, late: applicable && date < today && !done, ttShare: st ? st.doneMin / st.planned : 0 };
}
