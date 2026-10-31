import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { loadBank, setBankFetcher, type LoadedBank } from "@/lib/bank";
import { collectMistakes } from "@/lib/mistakes";
import { buildSchedule, daysBetween, subjectWeights, ymd } from "@/lib/planner";
import type { Attempt } from "@/lib/types";

setBankFetcher(async (path) => JSON.parse(readFileSync(`public/data/${path}`, "utf8")));
let bank: LoadedBank;
beforeAll(async () => {
  bank = await loadBank();
});

const day = (offset: number) => ymd(new Date(2026, 10, 1 + offset));

describe("study planner", () => {
  const topics = () => bank.topics.filter((t) => ["civil-som", "civil-fm", "history"].includes(t.subject));
  const plan = (n: number, rest: number[] = [0]) =>
    buildSchedule({
      today: day(0),
      examDate: day(n),
      minutesPerDay: 90,
      restDays: rest,
      topics: topics(),
      subjectWeight: subjectWeights([{ subjects: ["civil-som"], seats: 75 }, { subjects: ["civil-fm"], seats: 75 }, { subjects: ["history"], seats: 20 }]),
      mockPatterns: [{ id: "m1", questions: 150, minutes: 150, title: "Paper" }],
    });

  it("covers the days before the exam, skips rest days and keeps task keys unique", () => {
    const days = plan(60);
    expect(days).toHaveLength(60);
    expect(days.at(-1)!.date).toBe(day(59));
    const keys = days.flatMap((d) => d.tasks.map((t) => t.key));
    expect(new Set(keys).size).toBe(keys.length);
    for (const d of days) if (new Date(d.date + "T00:00").getDay() === 0) expect(d.tasks).toHaveLength(0);
  });
  it("teaches the heaviest subject first and gives every topic its first set before any second set", () => {
    const days = plan(120);
    const topicTasks = days.flatMap((d) => d.tasks).filter((t) => t.kind === "topic" && t.label.indexOf("Revise") !== 0);
    const firstSecond = topicTasks.findIndex((t) => t.kind === "topic" && t.set === 1);
    const firstSets = new Set(topicTasks.slice(0, firstSecond).map((t) => (t.kind === "topic" ? t.topic : "")));
    expect(firstSets.size).toBe(topics().filter((t) => t.qids.length > 0).length);
  });
  it("turns the last two weeks into mocks and mistake retries", () => {
    const days = plan(60);
    const tail = days.slice(-14).filter((d) => d.phase !== "rest");
    expect(tail.every((d) => d.phase === "revise")).toBe(true);
    expect(tail.some((d) => d.tasks.some((t) => t.kind === "mock"))).toBe(true);
    expect(tail.every((d) => d.tasks.some((t) => t.kind === "mistakes"))).toBe(true);
  });
  it("returns nothing for a date in the past", () => {
    expect(plan(0)).toEqual([]);
    expect(daysBetween(day(0), day(7))).toBe(7);
  });
});

describe("mistake notebook", () => {
  const attempt = (finishedAt: number, responses: (number | null)[], times: number[]): Attempt => ({
    id: String(finishedAt),
    config: { kind: "custom", key: "k", title: "t", mode: "exam", schemeId: "appsc", durationSec: 0, qids: [1, 2, 3] },
    finishedAt,
    responses,
    marked: [false, false, false],
    qTimeMs: times,
    elapsedMs: 0,
    key: [0, 0, 0],
    topics: ["A", "A", "B"],
  });
  it("keeps only the questions whose latest outcome is wrong or blank, and infers a reason", () => {
    const m = collectMistakes([attempt(1, [1, null, 0], [5000, 5000, 40000]), attempt(2, [0, null, 1], [5000, 5000, 1000])]);
    expect(m.map((x) => x.id).sort()).toEqual([2, 3]);
    expect(m.find((x) => x.id === 2)).toMatchObject({ kind: "skipped", times: 2, auto: "time" });
    expect(m.find((x) => x.id === 3)).toMatchObject({ kind: "wrong", times: 1 });
  });
});
