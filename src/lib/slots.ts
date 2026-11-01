import type { TopicInfo } from "./bank";
import { preferFresh, SLOT_SIZE } from "./tests";
import { scoreResponses, schemeById } from "./scoring";
import type { Attempt, QStat, TestConfig } from "./types";

/** The five study slots of a day. The student picks one topic for each, just before sitting down to study. */
export const SLOTS = [
  { id: 1, label: "Morning", hint: "First study block" },
  { id: 2, label: "Mid-morning", hint: "After breakfast" },
  { id: 3, label: "Afternoon", hint: "After lunch" },
  { id: 4, label: "Evening", hint: "After a break" },
  { id: 5, label: "Night", hint: "Last study block" },
] as const;

export const SLOT_ROUND_MAX = 2; // 10 + 10 more per slot
export const SLEEP_SIZE = 20;
export const DAY_TARGET = 100;

const prefix = (day: string, slot: number) => `slot:${day}:${slot}:`;

/** Finished attempts of one slot today, oldest first. */
export function slotAttempts(attempts: Attempt[], day: string, slot: number): Attempt[] {
  return attempts.filter((a) => a.config.key.startsWith(prefix(day, slot))).sort((x, y) => x.finishedAt - y.finishedAt);
}

export interface SlotState {
  slot: number;
  attempts: Attempt[];
  /** Questions answered correctly / asked, over the rounds done so far. */
  asked: number;
  correct: number;
  /** Topic of the latest round, so "10 more" defaults to it. */
  topic?: string;
  /** Round the next start would be (1 = first 10, 2 = the extra 10). */
  nextRound: number;
}

export function slotState(attempts: Attempt[], day: string, slot: number): SlotState {
  const list = slotAttempts(attempts, day, slot);
  let asked = 0;
  let correct = 0;
  for (const a of list) {
    const s = scoreResponses(a.responses, a.key, schemeById(a.config.schemeId));
    asked += a.config.qids.length;
    correct += s.correct;
  }
  return { slot, attempts: list, asked, correct, topic: list[list.length - 1]?.config.topic, nextRound: list.length + 1 };
}

export const sleepKey = (day: string) => `sleep:${day}`;
export const sleepAttempt = (attempts: Attempt[], day: string) => attempts.find((a) => a.config.key === sleepKey(day));

/** Total questions answered today across all slots and the bedtime round. */
export function dayTotal(attempts: Attempt[], day: string): number {
  return attempts
    .filter((a) => a.config.key.startsWith(`slot:${day}:`) || a.config.key === sleepKey(day))
    .reduce((n, a) => n + a.config.qids.length, 0);
}

/** 10 questions from one chosen topic, fresh ones first, never repeating a question already served in this slot today. */
export function slotQuiz(
  topic: TopicInfo,
  attempts: Attempt[],
  qstats: Record<number, QStat>,
  day: string,
  slot: number,
  schemeId: string,
): TestConfig | null {
  const used = new Set(slotAttempts(attempts, day, slot).flatMap((a) => a.config.qids));
  const round = slotAttempts(attempts, day, slot).length + 1;
  const pool = preferFresh(topic.qids, qstats).filter((id) => !used.has(id));
  const qids = pool.slice(0, SLOT_SIZE);
  if (!qids.length) return null;
  const def = SLOTS.find((s) => s.id === slot)!;
  return {
    kind: "slot",
    key: `${prefix(day, slot)}${round}`,
    title: `${def.label} · ${topic.name}`,
    subtitle: `${qids.length} questions${round > 1 ? ` · round ${round}` : ""}`,
    mode: "practice",
    schemeId,
    durationSec: 0,
    qids,
    topic: topic.name,
  };
}

/**
 * Bedtime round: the questions the student got wrong or left blank in today's slots, up to 20.
 * Null while there is nothing to revise.
 */
export function sleepQuiz(attempts: Attempt[], day: string, schemeId: string, isActive: (id: number) => boolean): TestConfig | null {
  const missed: number[] = [];
  const todays = attempts.filter((a) => a.config.key.startsWith(`slot:${day}:`));
  for (const a of todays) {
    a.config.qids.forEach((id, i) => {
      const r = a.responses[i];
      if ((r == null || r !== a.key[i]) && isActive(id) && !missed.includes(id)) missed.push(id);
    });
  }
  const qids = missed.slice(0, SLEEP_SIZE);
  if (!qids.length) return null;
  return {
    kind: "slot",
    key: sleepKey(day),
    title: "Before sleep · today's mistakes",
    subtitle: `${qids.length} questions you missed today`,
    mode: "practice",
    schemeId,
    durationSec: 0,
    qids,
  };
}
