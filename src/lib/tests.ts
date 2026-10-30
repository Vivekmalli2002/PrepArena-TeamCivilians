import type { LoadedBank } from "./bank";
import { hashString, mulberry32, shuffle } from "./random";
import type { Mode, QStat, TestConfig } from "./types";

export const SET_SIZE = 25;
export const DAILY_SIZE = 10;
export const FULL_MOCK = { count: 50, minutes: 50 };
export const TOPIC_MOCK = { count: 25, minutes: 25 };

const perQ = (n: number) => n * 60;

export function topicSets(qids: number[], size = SET_SIZE): number[][] {
  const sets: number[][] = [];
  for (let i = 0; i < qids.length; i += size) sets.push(qids.slice(i, i + size));
  // Fold a tiny last set into the previous one so no set is a 2-question stub.
  if (sets.length > 1 && sets[sets.length - 1].length < size / 2) {
    const last = sets.pop()!;
    sets[sets.length - 1].push(...last);
  }
  return sets;
}

export function topicSetTest(topic: string, setIndex: number, qids: number[], mode: Mode, schemeId: string): TestConfig {
  return {
    kind: "topic",
    key: `topic:${topic}:${setIndex}`,
    title: `${topic} · Set ${setIndex + 1}`,
    subtitle: `${qids.length} questions`,
    mode,
    schemeId,
    durationSec: perQ(qids.length),
    qids,
    topic,
  };
}

export function subtopicTest(topic: string, subtopic: string, qids: number[], mode: Mode, schemeId: string): TestConfig {
  return {
    kind: "subtopic",
    key: `subtopic:${topic}:${subtopic}`,
    title: subtopic,
    subtitle: topic,
    mode,
    schemeId,
    durationSec: perQ(qids.length),
    qids,
    topic,
  };
}

export function topicMock(topic: string, pool: number[], schemeId: string, count = TOPIC_MOCK.count): TestConfig {
  const qids = shuffle(pool).slice(0, count);
  return {
    kind: "topic-mock",
    key: `topic-mock:${topic}`,
    title: `${topic} · Mock`,
    subtitle: `${qids.length} Q · ${qids.length} min · exam mode`,
    mode: "exam",
    schemeId,
    durationSec: perQ(qids.length),
    qids,
    topic,
  };
}

/** Full mock drawn proportionally from every topic, so it mirrors the paper's spread. */
export function fullMock(bank: LoadedBank, schemeId: string, count = FULL_MOCK.count, minutes = FULL_MOCK.minutes): TestConfig {
  const total = bank.questions.length;
  const picks: number[] = [];
  const quotas = bank.topics.map((t) => ({ t, exact: (t.count / total) * count }));
  quotas.forEach((q) => picks.push(...shuffle(q.t.qids).slice(0, Math.floor(q.exact))));
  // Hand out the remaining seats by largest fractional part.
  const rest = quotas
    .map((q) => ({ ...q, frac: q.exact - Math.floor(q.exact) }))
    .sort((a, b) => b.frac - a.frac);
  for (const q of rest) {
    if (picks.length >= count) break;
    const extra = shuffle(q.t.qids).find((id) => !picks.includes(id));
    if (extra != null) picks.push(extra);
  }
  return {
    kind: "mock",
    key: `mock:full:${count}`,
    title: "Full Mock Test",
    subtitle: `${count} Q · ${minutes} min · all topics`,
    mode: "exam",
    schemeId,
    durationSec: minutes * 60,
    qids: shuffle(picks),
  };
}

/** Same 10 questions for every student on a given day. */
export function dailyQuiz(bank: LoadedBank, day: string, schemeId: string): TestConfig {
  const rand = mulberry32(hashString(`tc-daily:${day}`));
  const qids = shuffle(
    bank.questions.map((q) => q.id),
    rand,
  ).slice(0, DAILY_SIZE);
  return {
    kind: "daily",
    key: `daily:${day}`,
    title: "Daily Quiz",
    subtitle: day,
    mode: "practice",
    schemeId,
    durationSec: perQ(DAILY_SIZE),
    qids,
  };
}

export type Pool = "all" | "unseen" | "wrong" | "bookmarked";

export interface CustomOptions {
  topics: string[];
  count: number;
  minutes: number;
  mode: Mode;
  schemeId: string;
  pool: Pool;
}

export function poolFilter(pool: Pool, qstats: Record<number, QStat>, bookmarks: number[]) {
  const marks = new Set(bookmarks);
  return (id: number) => {
    const s = qstats[id];
    if (pool === "unseen") return !s;
    if (pool === "wrong") return !!s && !s.last;
    if (pool === "bookmarked") return marks.has(id);
    return true;
  };
}

export function customTest(
  bank: LoadedBank,
  o: CustomOptions,
  qstats: Record<number, QStat>,
  bookmarks: number[],
): TestConfig | null {
  const keep = poolFilter(o.pool, qstats, bookmarks);
  const pool = bank.topics.filter((t) => o.topics.includes(t.name)).flatMap((t) => t.qids).filter(keep);
  if (!pool.length) return null;
  const qids = shuffle(pool).slice(0, o.count);
  return {
    kind: "custom",
    key: `custom:${[...o.topics].sort().join("|")}:${o.pool}`,
    title: o.topics.length === 1 ? `${o.topics[0]} · Custom` : "Custom Test",
    subtitle: `${qids.length} Q · ${o.minutes ? `${o.minutes} min` : "untimed"}`,
    mode: o.mode,
    schemeId: o.schemeId,
    durationSec: o.minutes * 60,
    qids,
    topic: o.topics.length === 1 ? o.topics[0] : undefined,
  };
}

/** "Practise this" from weak areas: wrong first, then unseen, then the rest. */
export function weakAreaTest(
  bank: LoadedBank,
  topic: string,
  qstats: Record<number, QStat>,
  schemeId: string,
  count = 15,
): TestConfig {
  const t = bank.topics.find((x) => x.name === topic)!;
  const wrong = shuffle(t.qids.filter((id) => qstats[id] && !qstats[id].last));
  const unseen = shuffle(t.qids.filter((id) => !qstats[id]));
  const rest = shuffle(t.qids.filter((id) => qstats[id]?.last));
  const qids = [...wrong, ...unseen, ...rest].slice(0, count);
  return {
    kind: "custom",
    key: `weak:${topic}`,
    title: `${topic} · Focus`,
    subtitle: `${qids.length} Q · weak-area drill`,
    mode: "practice",
    schemeId,
    durationSec: perQ(qids.length),
    qids,
    topic,
  };
}

export function revisionTest(qids: number[], title: string, schemeId: string): TestConfig {
  const picked = shuffle(qids).slice(0, 25);
  return {
    kind: "revision",
    key: `revision:${title}`,
    title,
    subtitle: `${picked.length} Q · practice`,
    mode: "practice",
    schemeId,
    durationSec: perQ(picked.length),
    qids: picked,
  };
}
