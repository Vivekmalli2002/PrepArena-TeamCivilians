import type { MistakeReason } from "./extras";
import type { Attempt } from "./types";

export interface Mistake {
  id: number;
  topic: string;
  /** What happened the last time: a wrong option, or left blank. */
  kind: "wrong" | "skipped";
  yourAnswer: number | null;
  correctAnswer: number;
  /** Times it went wrong or was skipped in total. */
  times: number;
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
      open.set(id, { id, topic: a.topics[i] ?? "", kind, yourAnswer: r, correctAnswer: a.key[i], times: n, lastAt: a.finishedAt, auto });
    });
  }
  return [...open.values()].sort((x, y) => y.lastAt - x.lastAt);
}
