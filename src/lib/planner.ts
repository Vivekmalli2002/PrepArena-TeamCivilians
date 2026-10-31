import type { TopicInfo } from "./bank";
import { topicSets, SET_SIZE } from "./tests";

export type PlanTask =
  | { key: string; kind: "topic"; topic: string; subject: string; set: number; minutes: number; label: string }
  | { key: string; kind: "mock"; patternId: string; questions: number; minutes: number; label: string }
  | { key: string; kind: "mistakes"; minutes: number; label: string };

export interface PlanDay {
  date: string; // YYYY-MM-DD
  /** "learn" = cover every topic; "revise" = final stretch of mocks, mistakes and weak topics. */
  phase: "learn" | "revise" | "rest";
  tasks: PlanTask[];
}

export interface PlanInput {
  today: string;
  examDate: string;
  minutesPerDay: number;
  restDays: number[];
  topics: TopicInfo[];
  /** Share of the exam each subject carries (any positive weights). */
  subjectWeight: Record<string, number>;
  /** Pattern ids of the student's mock papers, cycled through in the final stretch. */
  mockPatterns: { id: string; questions: number; minutes: number; title: string }[];
}

const MS_DAY = 86_400_000;
const REVISION_DAYS = 14;
const MAX_SETS_PER_TOPIC = 4;

export function ymd(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export function daysBetween(a: string, b: string) {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / MS_DAY);
}

/**
 * A deterministic day-by-day plan. Learning days work through topic practice sets, most-weighted subjects first and
 * the first set of every topic before any second set; the last two weeks swap to mock papers, mistake retries and the
 * heaviest topics again. The plan depends only on the settings and the bank, so ticking tasks off stays stable.
 */
export function buildSchedule(inp: PlanInput): PlanDay[] {
  const n = Math.min(400, daysBetween(inp.today, inp.examDate));
  if (n <= 0) return [];
  const totalW = Object.values(inp.subjectWeight).reduce((a, b) => a + b, 0) || 1;
  const topics = inp.topics.filter((t) => t.qids.length > 0);
  const prio = (t: TopicInfo) => (inp.subjectWeight[t.subject] ?? 0.2 * totalW) / totalW + Math.min(t.qids.length, 400) / 4000;
  const ordered = [...topics].sort((a, b) => prio(b) - prio(a) || a.name.localeCompare(b.name));
  // round r holds the (r+1)-th practice set of every topic that has one
  const queue: PlanTask[] = [];
  for (let r = 0; r < MAX_SETS_PER_TOPIC; r++) {
    for (const t of ordered) {
      const sets = topicSets(t.qids, SET_SIZE);
      if (sets.length > r) {
        queue.push({ key: "", kind: "topic", topic: t.name, subject: t.subject, set: r, minutes: Math.max(10, Math.min(sets[r].length, SET_SIZE)), label: `${t.name} · Set ${r + 1}` });
      }
    }
  }
  const slots = Math.max(1, Math.floor(inp.minutesPerDay / 30));
  const days: PlanDay[] = [];
  let qi = 0;
  let mockN = 0;
  const revStart = Math.max(0, n - REVISION_DAYS);
  for (let d = 0; d < n; d++) {
    const date = ymd(new Date(parse(inp.today).getTime() + d * MS_DAY));
    const dow = parse(date).getDay();
    if (inp.restDays.includes(dow)) {
      days.push({ date, phase: "rest", tasks: [] });
      continue;
    }
    const tasks: PlanTask[] = [];
    const push = (t: PlanTask) => tasks.push({ ...t, key: `${date}:${tasks.length}` });
    if (d >= revStart) {
      // final stretch: a mock every third day, mistakes daily, the rest on the heaviest topics
      const mock = inp.mockPatterns.length && (d - revStart) % 3 === 2 ? inp.mockPatterns[mockN++ % inp.mockPatterns.length] : null;
      if (mock) push({ key: "", kind: "mock", patternId: mock.id, questions: mock.questions, minutes: mock.minutes, label: `Mock · ${mock.title}` });
      push({ key: "", kind: "mistakes", minutes: 15, label: "Retry open mistakes" });
      const extra = mock ? 0 : Math.max(1, slots - 1);
      for (let k = 0; k < extra; k++) {
        const t = ordered[(d * 3 + k) % Math.max(1, ordered.length)];
        if (t) push({ key: "", kind: "topic", topic: t.name, subject: t.subject, set: 0, minutes: 25, label: `Revise · ${t.name}` });
      }
      days.push({ date, phase: "revise", tasks });
      continue;
    }
    for (let k = 0; k < slots && qi < queue.length; k++) push(queue[qi++]);
    // spread what is left evenly: if the queue would not finish by the revision phase, add a slot
    const learnLeft = revStart - d;
    if (queue.length - qi > learnLeft * slots && qi < queue.length) push(queue[qi++]);
    if (d % 4 === 3) push({ key: "", kind: "mistakes", minutes: 10, label: "Retry open mistakes" });
    days.push({ date, phase: "learn", tasks });
  }
  return days;
}

/** Subject shares from the seats of the student's papers. */
export function subjectWeights(sections: { subjects: string[]; seats: number }[]): Record<string, number> {
  const w: Record<string, number> = {};
  for (const s of sections) for (const id of s.subjects) w[id] = (w[id] ?? 0) + s.seats / s.subjects.length;
  return w;
}
