import type { LoadedBank } from "./bank";
import { hashString, mulberry32, shuffle } from "./random";
import { inRevision } from "./srs";
import type { Mode, QStat, TestConfig } from "./types";

export const SET_SIZE = 25;
export const DAILY_SIZE = 10;
export const FULL_MOCK = { count: 50, minutes: 50 };
export const TOPIC_MOCK = { count: 25, minutes: 25 };

const perQ = (n: number) => n * 60;

/**
 * Anti-repeat ordering: unseen questions first (shuffled), then the ones answered longest ago.
 * De-duplicates, so a test can never contain the same question twice.
 */
export function preferFresh(ids: readonly number[], qstats: Record<number, QStat> = {}, rand: () => number = Math.random): number[] {
  const uniq = [...new Set(ids)];
  const unseen = shuffle(uniq.filter((id) => !qstats[id]), rand);
  const seen = shuffle(uniq.filter((id) => qstats[id]), rand).sort((a, b) => qstats[a].at - qstats[b].at);
  return [...unseen, ...seen];
}

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

export function topicMock(topic: string, pool: number[], schemeId: string, count = TOPIC_MOCK.count, qstats: Record<number, QStat> = {}): TestConfig {
  const qids = shuffle(preferFresh(pool, qstats).slice(0, count));
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

/** Picks `n` ids spread across `topics` in proportion to their size (largest remainders). */
function spread(topics: LoadedBank["topics"], n: number, qstats: Record<number, QStat> = {}): number[] {
  const total = topics.reduce((k, t) => k + t.qids.length, 0);
  if (!total || n <= 0) return [];
  const quotas = topics.map((t) => ({ t, exact: (t.qids.length / total) * Math.min(n, total) }));
  const picks = quotas.flatMap((q) => preferFresh(q.t.qids, qstats).slice(0, Math.floor(q.exact)));
  const rest = quotas.sort((x, y) => y.exact - Math.floor(y.exact) - (x.exact - Math.floor(x.exact)));
  for (const q of rest) {
    if (picks.length >= Math.min(n, total)) break;
    const extra = preferFresh(q.t.qids, qstats).find((id) => !picks.includes(id));
    if (extra != null) picks.push(extra);
  }
  return picks;
}

/**
 * Full mock: equal seats per subject, as APPSC papers have balanced sections (e.g. Group-II
 * screening is 5 × 30). A subject with too few questions hands its unused seats to the others.
 * Within a subject, seats follow topic size.
 */
export function fullMock(bank: LoadedBank, schemeId: string, count = FULL_MOCK.count, minutes = FULL_MOCK.minutes, qstats: Record<number, QStat> = {}): TestConfig {
  const subjects = bank.subjects.map((s) => ({ id: s.id, topics: bank.topics.filter((t) => t.subject === s.id) }));
  const size = (sj: (typeof subjects)[number]) => sj.topics.reduce((k, t) => k + t.qids.length, 0);
  const seats = new Map(subjects.map((sj) => [sj.id, 0]));
  let left = count;
  let open = subjects.filter((sj) => size(sj) > 0);
  while (left > 0 && open.length) {
    const each = Math.max(1, Math.floor(left / open.length));
    for (const sj of open) {
      if (left <= 0) break;
      const add = Math.min(each, size(sj) - seats.get(sj.id)!, left);
      seats.set(sj.id, seats.get(sj.id)! + add);
      left -= add;
    }
    open = open.filter((sj) => seats.get(sj.id)! < size(sj));
  }
  const picks = [...new Set(subjects.flatMap((sj) => spread(sj.topics, seats.get(sj.id)!, qstats)))];
  const ids = bank.subjects.map((s) => s.id).sort();
  return {
    kind: "mock",
    // Scope is part of the key so personal bests compare like with like.
    key: `mock:full:${count}:${ids.join("+")}`,
    title: ids.length === 1 ? `Full Mock · ${bank.subjects[0].name}` : "Full Mock Test",
    subtitle: `${picks.length} Q · ${minutes} min · ${ids.length > 1 ? `${ids.length} subjects` : "all topics"}`,
    mode: "exam",
    schemeId,
    durationSec: minutes * 60,
    qids: shuffle(picks),
  };
}

/** Same 10 questions for every student on a given day. */
export function dailyQuiz(bank: LoadedBank, day: string, schemeId: string): TestConfig {
  const rand = mulberry32(hashString(`tc-daily:${day}`));
  const qids = shuffle(bank.allActive, rand).slice(0, DAILY_SIZE);
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

export type Pool = "all" | "unseen" | "revision" | "bookmarked";

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
    if (pool === "revision") return inRevision(s);
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
  const qids = shuffle(preferFresh(pool, qstats).slice(0, o.count));
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
  const wrong = shuffle(t.qids.filter((id) => inRevision(qstats[id])));
  const unseen = shuffle(t.qids.filter((id) => !qstats[id]));
  const rest = shuffle(t.qids.filter((id) => qstats[id] && !inRevision(qstats[id])));
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

/** Keeps the given order (callers put due/most-urgent first) and caps at 25. */
export function revisionTest(qids: number[], title: string, schemeId: string): TestConfig {
  const picked = qids.slice(0, 25);
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
