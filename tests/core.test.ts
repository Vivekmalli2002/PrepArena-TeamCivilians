import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { index } from "@/lib/bank";
import { splitStatements } from "@/lib/format";
import { dayKey } from "@/lib/random";
import { schemeById, scoreResponses } from "@/lib/scoring";
import { currentStreak, paletteStatus, useApp, useSession } from "@/lib/store";
import { dailyQuiz, fullMock, topicSets, topicSetTest } from "@/lib/tests";
import type { Bank } from "@/lib/types";

const raw = JSON.parse(readFileSync("content/team-civilians-questions.json", "utf8"));
const bank = index({ version: "t", ...raw } as Bank);

describe("scoring", () => {
  it("applies negative marking per scheme", () => {
    const s = scoreResponses([0, 1, null, 2], [0, 0, 1, 2], schemeById("2-066"));
    expect(s).toMatchObject({ correct: 2, wrong: 1, skipped: 1, attempted: 3, net: 3.34, max: 8 });
    expect(scoreResponses([1, 1, 1], [0, 0, 0], schemeById("appsc")).net).toBe(-1);
    expect(scoreResponses([1], [0], schemeById("none")).net).toBe(0);
  });
});

describe("test builders", () => {
  it("derives 13 topics covering every question", () => {
    expect(bank.topics).toHaveLength(13);
    expect(bank.topics.reduce((n, t) => n + t.count, 0)).toBe(1193);
  });
  it("splits topics into sets without tiny stubs", () => {
    const sets = topicSets(Array.from({ length: 52 }, (_, i) => i));
    expect(sets.map((s) => s.length)).toEqual([25, 27]);
  });
  it("full mock has 50 unique questions spread across topics", () => {
    const m = fullMock(bank, "appsc");
    expect(new Set(m.qids).size).toBe(50);
    expect(new Set(m.qids.map((id) => bank.byId.get(id)!.topic)).size).toBeGreaterThan(8);
  });
  it("daily quiz is deterministic per day", () => {
    expect(dailyQuiz(bank, "2026-10-30", "appsc").qids).toEqual(dailyQuiz(bank, "2026-10-30", "appsc").qids);
    expect(dailyQuiz(bank, "2026-10-30", "appsc").qids).not.toEqual(dailyQuiz(bank, "2026-10-31", "appsc").qids);
  });
});

describe("CBT session (exam mode)", () => {
  beforeEach(() => {
    useApp.getState().resetAll();
    useSession.getState().start(topicSetTest("Pollution", 0, [1, 2, 3], "exam", "appsc"));
    useSession.getState().begin();
  });
  const s = () => useSession.getState().session!;

  it("does not save a selection until Save & Next", () => {
    useSession.getState().choose(2);
    useSession.getState().goTo(1); // navigate away without saving
    expect(s().responses[0]).toBeNull();
    expect(paletteStatus(s(), 0)).toBe("notAnswered");
    expect(paletteStatus(s(), 2)).toBe("notVisited");
  });

  it("tracks answered, marked and answered-&-marked", () => {
    const a = useSession.getState();
    a.choose(1);
    a.saveNext();
    useSession.getState().markNext();
    useSession.getState().choose(0);
    useSession.getState().markNext();
    expect([0, 1, 2].map((i) => paletteStatus(s(), i))).toEqual(["answered", "marked", "answeredMarked"]);
  });

  it("clear response removes the saved answer", () => {
    useSession.getState().choose(1);
    useSession.getState().saveNext();
    useSession.getState().goTo(0);
    useSession.getState().clear();
    expect(s().responses[0]).toBeNull();
  });

  it("submit records an attempt and per-question stats", () => {
    const q1 = bank.byId.get(1)!;
    useSession.getState().choose(q1.answerIndex);
    useSession.getState().saveNext();
    useSession.getState().tick(5000);
    const id = useSession.getState().submit(bank)!;
    const app = useApp.getState();
    expect(app.attempts.at(-1)!.id).toBe(id);
    expect(app.qstats[1]).toMatchObject({ n: 1, c: 1, last: true });
    expect(app.qstats[2]).toBeUndefined();
    expect(useSession.getState().session).toBeNull();
  });
});

describe("practice mode", () => {
  it("locks the first answer", () => {
    useSession.getState().start(topicSetTest("Pollution", 0, [1, 2], "practice", "appsc"));
    useSession.getState().choose(3);
    useSession.getState().choose(1);
    expect(useSession.getState().session!.responses[0]).toBe(3);
  });
});

describe("streak", () => {
  it("counts consecutive days and tolerates an unpractised today", () => {
    const t = new Date(2026, 9, 30);
    const d = (o: number) => dayKey(new Date(2026, 9, 30 - o));
    expect(currentStreak([d(0), d(1), d(2)], t)).toBe(3);
    expect(currentStreak([d(1), d(2)], t)).toBe(2);
    expect(currentStreak([d(2)], t)).toBe(0);
  });
});

describe("statement formatting", () => {
  it("splits numbered statements and keeps every character of the text", () => {
    const q = bank.byId.get(1)!.question;
    const blocks = splitStatements(q);
    expect(blocks.filter((b) => b.kind === "item").map((b) => b.label)).toEqual(["1", "2", "3"]);
    expect(blocks.at(-1)!.text).toMatch(/^How many/);
    const strip = (x: string) => x.replace(/\s|\d\./g, "");
    expect(strip(blocks.map((b) => b.text).join(""))).toBe(strip(q));
  });
  it("never loses text on any question in the bank", () => {
    const strip = (x: string) => x.replace(/\s/g, "");
    for (const q of bank.questions) {
      const blocks = splitStatements(q.question);
      const rebuilt = blocks.map((b) => (b.label ? `${b.label}. ` : "") + b.text).join(" ");
      expect(strip(rebuilt), `id ${q.id}`).toBe(strip(q.question));
    }
  });
});

describe("labelled statements", () => {
  it("splits Statement-I / Statement-II and keeps the instruction separate", () => {
    const b = splitStatements(
      "Consider the following statements: Statement-I : Hydrogen is clean. Statement-II : Hydrogen is abundant. In the light of the above statements, choose the correct answer:",
    );
    expect(b.map((x) => x.kind)).toEqual(["text", "item", "item", "text"]);
    expect(b[2].text).toBe("Statement-II : Hydrogen is abundant.");
  });
});
