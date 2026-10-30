import type { LoadedBank } from "./bank";
import { scoreAttempt } from "./scoring";
import type { Attempt, QStat } from "./types";

export interface TopicMastery {
  topic: string;
  total: number;
  seen: number;
  answered: number;
  correct: number;
  /** null until the student has answered at least one question in the topic. */
  accuracy: number | null;
}

export const MIN_FOR_WEAK = 5;

export function topicMastery(bank: LoadedBank, qstats: Record<number, QStat>): TopicMastery[] {
  return bank.topics.map((t) => {
    let seen = 0;
    let answered = 0;
    let correct = 0;
    for (const id of t.qids) {
      const s = qstats[id];
      if (!s) continue;
      seen++;
      answered += s.n;
      correct += s.c;
    }
    return { topic: t.name, total: t.count, seen, answered, correct, accuracy: answered ? correct / answered : null };
  });
}

/** Three lowest-accuracy topics with enough answers to be meaningful. */
export function weakAreas(m: TopicMastery[], n = 3) {
  return m
    .filter((x) => x.accuracy != null && x.answered >= MIN_FOR_WEAK)
    .sort((a, b) => a.accuracy! - b.accuracy! || b.total - a.total)
    .slice(0, n);
}

export function trend(attempts: Attempt[], last = 15) {
  return attempts.slice(-last).map((a, i) => {
    const s = scoreAttempt(a);
    return {
      i: i + 1,
      id: a.id,
      title: a.config.title,
      date: a.finishedAt,
      score: Math.round(s.percent * 100),
      accuracy: Math.round(s.accuracy * 100),
    };
  });
}

/** Average seconds per attempted question in timed exams vs the per-question allowance. */
export function timeManagement(attempts: Attempt[], last = 10) {
  const recent = attempts.filter((a) => a.config.durationSec > 0 && a.config.mode === "exam").slice(-last);
  if (!recent.length) return null;
  let spent = 0;
  let qs = 0;
  let allowance = 0;
  for (const a of recent) {
    spent += a.qTimeMs.reduce((x, y) => x + y, 0);
    qs += a.config.qids.length;
    allowance += a.config.durationSec * 1000;
  }
  return { avgMs: spent / qs, targetMs: allowance / qs, tests: recent.length };
}
