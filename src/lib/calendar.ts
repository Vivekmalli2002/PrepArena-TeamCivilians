/**
 * Exam calendar: month grids from today to the last announced exam, the 60-day Mains plan laid onto its dates, the exam dates
 * announced so far, and what counts as a completed day (the plan day is fully ticked in the Group-I Mains checklist, or the
 * learner marked the date done themselves).
 */
import { EXAM_DATES, type ExamDate } from "@/content/exam-dates";
import { DAYS, dayDone, type ScheduleDay } from "./schedule";

const MS_DAY = 86_400_000;
const parts = (key: string) => key.split("-").map(Number) as [number, number, number];
const utc = (key: string) => Date.UTC(...(([y, m, d]) => [y, m - 1, d] as [number, number, number])(parts(key)));
export const keyOf = (y: number, m0: number, d: number) => `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Whole days from `from` to `to` (negative once `to` is past). */
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / MS_DAY);

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const weekdayOf = (key: string) => new Date(utc(key)).getUTCDay();
export const fmtDay = (key: string) => {
  const [y, m, d] = parts(key);
  return `${WEEKDAYS[weekdayOf(key)]} ${String(d).padStart(2, "0")} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
};

export const announced = (): (ExamDate & { date: string })[] => EXAM_DATES.filter((e): e is ExamDate & { date: string } => !!e.date).sort((a, b) => a.date.localeCompare(b.date));
export const notAnnounced = () => EXAM_DATES.filter((e) => !e.date);

const PLAN_BY_DATE = new Map(DAYS.map((d) => [d.date, d]));
export const planDayOn = (key: string): ScheduleDay | undefined => PLAN_BY_DATE.get(key);

export interface Cell {
  key: string;
  day: number;
  exam?: ExamDate;
  plan?: ScheduleDay;
}
export interface MonthGrid {
  year: number;
  month0: number;
  title: string;
  /** Weeks (Sunday first); null pads the first and last week. */
  weeks: (Cell | null)[][];
}

export function buildMonth(year: number, month0: number): MonthGrid {
  const first = new Date(Date.UTC(year, month0, 1)).getUTCDay();
  const n = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const exams = announced();
  const cells: (Cell | null)[] = Array(first).fill(null);
  for (let d = 1; d <= n; d++) {
    const key = keyOf(year, month0, d);
    cells.push({ key, day: d, exam: exams.find((e) => e.date === key), plan: planDayOn(key) });
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (Cell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return { year, month0, title: `${MONTHS[month0]} ${year}`, weeks };
}

/** Months from the one containing `from` to the one containing the last announced exam. */
export function monthsToShow(from: string): { year: number; month0: number }[] {
  const last = announced().at(-1)?.date ?? from;
  const [fy, fm] = parts(from);
  const [ly, lm] = parts(last < from ? from : last);
  const out: { year: number; month0: number }[] = [];
  for (let y = fy, m = fm - 1; y < ly || (y === ly && m <= lm - 1); m++) {
    if (m > 11) (m = 0), y++;
    out.push({ year: y, month0: m });
    if (out.length > 24) break;
  }
  return out;
}

/** A date is done when its plan day is fully ticked in the Mains checklist or the learner marked it. */
export function dateDone(key: string, sched: Record<string, number>, marked: Record<string, number>): boolean {
  const plan = planDayOn(key);
  return !!marked[key] || (!!plan && dayDone(plan, sched));
}

export interface Remaining {
  today: string;
  /** The plan day that falls on today, if the plan is running. */
  planToday: ScheduleDay | null;
  planStart: string;
  planEnd: string;
  planStarted: boolean;
  planOver: boolean;
  /** Plan days finished (plan fully ticked or date marked), and how many plan dates have already begun. */
  planDone: number;
  planBegun: number;
  /** Begun plan days that are not finished. */
  behind: ScheduleDay[];
  /** Plan days still to come (after today). */
  planAhead: number;
  /** Calendar days left in the plan counting today, and days from the plan's end to each announced exam. */
  planDaysLeft: number;
  exams: { exam: ExamDate & { date: string }; daysLeft: number; passed: boolean; freeAfterPlan: number }[];
}

export function remaining(today: string, sched: Record<string, number>, marked: Record<string, number>): Remaining {
  const planStart = DAYS[0].date;
  const planEnd = DAYS[DAYS.length - 1].date;
  const begun = DAYS.filter((d) => d.date <= today);
  const behind = begun.filter((d) => d.date < today && !dateDone(d.date, sched, marked));
  const planDone = DAYS.filter((d) => dateDone(d.date, sched, marked)).length;
  return {
    today,
    planToday: planDayOn(today) ?? null,
    planStart,
    planEnd,
    planStarted: today >= planStart,
    planOver: today > planEnd,
    planDone,
    planBegun: begun.length,
    behind,
    planAhead: DAYS.filter((d) => d.date > today).length,
    planDaysLeft: Math.max(0, daysBetween(today, planEnd) + 1),
    exams: announced().map((e) => ({ exam: e, daysLeft: daysBetween(today, e.date), passed: e.date < today, freeAfterPlan: Math.max(0, daysBetween(planEnd, e.date) - 1) })),
  };
}
