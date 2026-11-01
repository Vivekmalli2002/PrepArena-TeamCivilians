import { describe, expect, it } from "vitest";
import { makeBackup, parseBackup } from "@/lib/backup";
import { daysAgo, isMastered, mistakeStats, mistakesToCsv, sortMistakes, type Mistake } from "@/lib/mistakes";

const m = (id: number, over: Partial<Mistake> = {}): Mistake => ({
  id,
  topic: "Polity",
  kind: "wrong",
  yourAnswer: 1,
  correctAnswer: 2,
  times: 1,
  firstAt: 1000,
  lastAt: 2000,
  auto: "revise",
  ...over,
});

describe("error log book", () => {
  it("hides a mastered mistake until it goes wrong again afterwards", () => {
    const x = m(1, { lastAt: 5000 });
    expect(isMastered(x, {})).toBe(false);
    expect(isMastered(x, { 1: 6000 })).toBe(true);
    expect(isMastered({ ...x, lastAt: 7000 }, { 1: 6000 })).toBe(false); // missed again after being marked
  });

  it("sorts by latest, most missed, oldest and topic", () => {
    const list = [m(1, { lastAt: 10, firstAt: 5, times: 1, topic: "B" }), m(2, { lastAt: 30, firstAt: 9, times: 3, topic: "A" }), m(3, { lastAt: 20, firstAt: 1, times: 2, topic: "C" })];
    expect(sortMistakes(list, "recent").map((x) => x.id)).toEqual([2, 3, 1]);
    expect(sortMistakes(list, "missed").map((x) => x.id)).toEqual([2, 3, 1]);
    expect(sortMistakes(list, "oldest").map((x) => x.id)).toEqual([3, 1, 2]);
    expect(sortMistakes(list, "topic").map((x) => x.id)).toEqual([2, 1, 3]);
  });

  it("summarises reasons, repeats, blanks and weakest topics", () => {
    const list = [m(1, { topic: "Polity", times: 2 }), m(2, { topic: "Polity", kind: "skipped", auto: "time" }), m(3, { topic: "History", auto: "guess" })];
    const s = mistakeStats(list, (x) => x.auto);
    expect(s).toMatchObject({ open: 3, repeated: 1, blank: 1, byReason: { revise: 1, time: 1, guess: 1 } });
    expect(s.weakTopics[0]).toEqual({ topic: "Polity", n: 2 });
  });

  it("exports one CSV row per mistake with quotes escaped", () => {
    const q = { id: 1, topic: "Polity", question: 'Who said "Satyameva Jayate"?\nChoose.', options: ["A1", "B1", "C1", "D1"], answerIndex: 2, explanation: "", source: "" };
    const text = mistakesToCsv([{ m: m(1, { lastAt: Date.UTC(2026, 10, 1) }), q, reason: "Concept gap", note: "Mundaka Upanishad" }]);
    const lines = text.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('"Why it went wrong"');
    expect(lines[1]).toContain('""Satyameva Jayate""');
    expect(lines[1]).toContain('"C"');
    expect(lines[1]).toContain('"2026-11-01"');
    expect(lines[1]).toContain("Mundaka Upanishad");
  });

  it("counts whole days since the last miss", () => {
    expect(daysAgo(0, 3 * 86_400_000 + 5)).toBe(3);
    expect(daysAgo(1000, 500)).toBe(0);
  });

  it("keeps notes and mastered marks through backup and restore", () => {
    const base = { profile: null, theme: "system" as const, attempts: [], qstats: {}, bookmarks: [], activeDays: [] };
    const back = parseBackup(JSON.stringify(makeBackup({ ...base, mistakeNotes: { 7: "remember" }, mistakeDone: { 7: 123 } })));
    expect(back.mistakeNotes).toEqual({ 7: "remember" });
    expect(back.mistakeDone).toEqual({ 7: 123 });
    // an old backup that still carries countdowns restores without them
    const old = parseBackup(JSON.stringify({ kind: "team-civilians-backup", version: 2, data: { ...base, countdowns: [{ id: "x" }] } }));
    expect("countdowns" in old).toBe(false);
  });
});
