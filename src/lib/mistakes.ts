import type { MistakeReason } from "./extras";
import type { Attempt, Question } from "./types";

export interface Mistake {
  id: number;
  topic: string;
  /** What happened the last time: a wrong option, or left blank. */
  kind: "wrong" | "skipped";
  yourAnswer: number | null;
  correctAnswer: number;
  /** Times it went wrong or was skipped in total. */
  times: number;
  /** When it first went wrong (in the saved attempts). */
  firstAt: number;
  lastAt: number;
  /** Reason worked out from how long the student took; the student can override it. */
  auto: MistakeReason;
}

/**
 * Open mistakes: questions whose most recent outcome in the saved attempts was wrong or blank.
 * A question answered correctly afterwards drops out. Reason is inferred from time spent versus the
 * test average (very quick wrong → guess, long wrong → concept gap, blank → ran short of time).
 */
export function collectMistakes(attempts: Attempt[]): Mistake[] {
  const open = new Map<number, Mistake>();
  const times = new Map<number, number>();
  for (const a of [...attempts].sort((x, y) => x.finishedAt - y.finishedAt)) {
    const spent = a.qTimeMs.filter((t) => t > 0);
    const avg = a.config.omr ? 0 : spent.length ? spent.reduce((x, y) => x + y, 0) / spent.length : 0;
    a.config.qids.forEach((id, i) => {
      const r = a.responses[i];
      const ok = r != null && r === a.key[i];
      if (ok) {
        open.delete(id);
        return;
      }
      const t = a.qTimeMs[i] ?? 0;
      const kind = r == null ? "skipped" : "wrong";
      const n = (times.get(id) ?? 0) + 1;
      times.set(id, n);
      const auto: MistakeReason =
        kind === "skipped" ? "time" : avg && t < avg * 0.5 ? "guess" : avg && t > avg * 1.4 ? "concept" : "revise";
      open.set(id, { id, topic: a.topics[i] ?? "", kind, yourAnswer: r, correctAnswer: a.key[i], times: n, firstAt: open.get(id)?.firstAt ?? a.finishedAt, lastAt: a.finishedAt, auto });
    });
  }
  return [...open.values()].sort((x, y) => y.lastAt - x.lastAt);
}

/** A mistake the student marked as mastered stays hidden until it goes wrong again afterwards. */
export const isMastered = (m: Pick<Mistake, "id" | "lastAt">, done: Record<number, number>) => (done[m.id] ?? 0) >= m.lastAt && !!done[m.id];

export type MistakeSort = "recent" | "missed" | "topic" | "oldest";

export function sortMistakes(list: Mistake[], key: MistakeSort): Mistake[] {
  const l = [...list];
  if (key === "missed") return l.sort((a, b) => b.times - a.times || b.lastAt - a.lastAt);
  if (key === "topic") return l.sort((a, b) => a.topic.localeCompare(b.topic) || b.lastAt - a.lastAt);
  if (key === "oldest") return l.sort((a, b) => a.firstAt - b.firstAt);
  return l.sort((a, b) => b.lastAt - a.lastAt);
}

export interface MistakeStats {
  open: number;
  /** Missed in two or more different tests. */
  repeated: number;
  blank: number;
  byReason: Record<string, number>;
  /** Topics with the most open mistakes, most first. */
  weakTopics: { topic: string; n: number }[];
}

export function mistakeStats(list: Mistake[], reasonOf: (m: Mistake) => string): MistakeStats {
  const byReason: Record<string, number> = {};
  const topics = new Map<string, number>();
  let repeated = 0;
  let blank = 0;
  for (const m of list) {
    byReason[reasonOf(m)] = (byReason[reasonOf(m)] ?? 0) + 1;
    topics.set(m.topic, (topics.get(m.topic) ?? 0) + 1);
    if (m.times >= 2) repeated++;
    if (m.kind === "skipped") blank++;
  }
  return { open: list.length, repeated, blank, byReason, weakTopics: [...topics].map(([topic, n]) => ({ topic, n })).sort((a, b) => b.n - a.n || a.topic.localeCompare(b.topic)) };
}

/** Whole days since `t`, for "last missed 3 days ago". */
export const daysAgo = (t: number, now = Date.now()) => Math.max(0, Math.floor((now - t) / 86_400_000));

const csv = (v: string | number) => `"${String(v).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

/** The notebook as a spreadsheet: one row per mistake, with your reason and note. */
export function mistakesToCsv(
  rows: { m: Mistake; q?: Question; reason: string; note?: string }[],
  letters = ["A", "B", "C", "D", "E"],
): string {
  const head = ["Topic", "Question", "Options", "Correct answer", "Your answer", "Why it went wrong", "Times missed", "Last missed", "My note"];
  const lines = rows.map(({ m, q, reason, note }) =>
    [
      m.topic,
      q?.question ?? `#${m.id}`,
      (q?.options ?? []).map((o, i) => `${letters[i]}. ${o}`).join("  |  "),
      letters[m.correctAnswer] ?? "",
      m.yourAnswer == null ? "(left blank)" : (letters[m.yourAnswer] ?? ""),
      reason,
      m.times,
      new Date(m.lastAt).toISOString().slice(0, 10),
      note ?? "",
    ].map(csv).join(","),
  );
  return [head.map(csv).join(","), ...lines].join("\n");
}
