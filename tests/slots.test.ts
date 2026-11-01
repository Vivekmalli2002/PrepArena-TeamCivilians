import { describe, expect, it } from "vitest";
import type { TopicInfo } from "@/lib/bank";
import { dayTotal, sleepKey, sleepQuiz, slotQuiz, slotState } from "@/lib/slots";
import type { Attempt } from "@/lib/types";

const topic: TopicInfo = { name: "Beams", subject: "som", unit: 1, file: "x", qids: Array.from({ length: 25 }, (_, i) => i + 1), all: [], subtopics: [], count: 25 };
const DAY = "2026-11-02";

function attempt(key: string, qids: number[], responses: (number | null)[], keyAns: number[], topicName = "Beams"): Attempt {
  return {
    id: key, finishedAt: Date.now(),
    config: { kind: "slot", key, title: "t", mode: "practice", schemeId: "appsc", durationSec: 0, qids, topic: topicName },
    responses, marked: [], qTimeMs: [], elapsedMs: 0, key: keyAns, topics: qids.map(() => topicName),
  };
}

describe("study slots", () => {
  it("serves 10 questions from the chosen topic and never repeats them in the same slot the same day", () => {
    const first = slotQuiz(topic, [], {}, DAY, 1, "appsc")!;
    expect(first.qids).toHaveLength(10);
    expect(first.key).toBe(`slot:${DAY}:1:1`);
    expect(first.topic).toBe("Beams");
    const done = attempt(first.key, first.qids, first.qids.map(() => 0), first.qids.map(() => 0));
    const more = slotQuiz(topic, [done], {}, DAY, 1, "appsc")!;
    expect(more.key).toBe(`slot:${DAY}:1:2`);
    expect(more.qids.filter((q) => first.qids.includes(q))).toHaveLength(0);
  });

  it("tracks asked and correct per slot and the day total", () => {
    const a = attempt(`slot:${DAY}:2:1`, [1, 2, 3], [0, 1, null], [0, 0, 0]);
    const st = slotState([a], DAY, 2);
    expect(st.asked).toBe(3);
    expect(st.correct).toBe(1);
    expect(st.topic).toBe("Beams");
    expect(st.nextRound).toBe(2);
    expect(dayTotal([a], DAY)).toBe(3);
    expect(dayTotal([a], "2026-11-03")).toBe(0);
  });

  it("builds the bedtime round from the day's wrong and blank answers only", () => {
    const a = attempt(`slot:${DAY}:1:1`, [1, 2, 3, 4], [0, 1, null, 0], [0, 0, 0, 0]);
    const b = attempt(`slot:${DAY}:3:1`, [5, 2], [1, 1], [0, 0]);
    const old = attempt(`slot:2026-11-01:1:1`, [9], [1], [0]);
    const cfg = sleepQuiz([a, b, old], DAY, "appsc", (id) => id !== 5)!;
    expect(cfg.key).toBe(sleepKey(DAY));
    expect(cfg.qids).toEqual([2, 3]);
    expect(sleepQuiz([attempt(`slot:${DAY}:1:1`, [1], [0], [0])], DAY, "appsc", () => true)).toBeNull();
  });
});
