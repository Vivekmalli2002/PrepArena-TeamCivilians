import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { loadBank, loadQuestions, setBankFetcher, type LoadedBank } from "@/lib/bank";
import { splitStatements } from "@/lib/format";
import { dayKey } from "@/lib/random";
import { schemeById, scoreResponses } from "@/lib/scoring";
import { INTERVAL_DAYS, inRevision, isDue, review } from "@/lib/srs";
import { currentStreak, migrateApp, paletteStatus, useApp, useSession } from "@/lib/store";
import { dailyQuiz, fullMock, topicSets, topicSetTest } from "@/lib/tests";
import type { Question } from "@/lib/types";

// Reads what `npm run content` published to public/data (the test script runs it first).
setBankFetcher(async (path) => JSON.parse(readFileSync(`public/data/${path}`, "utf8")));
const source: Question[] = JSON.parse(readFileSync("content/team-civilians-questions.json", "utf8")).questions;
const fixes = JSON.parse(readFileSync("content/corrections.json", "utf8"));
let bank: LoadedBank;
let byId: Map<number, Question>;
beforeAll(async () => {
  bank = await loadBank();
  byId = await loadQuestions(bank.topics.flatMap((t) => t.all));
});

describe("scoring", () => {
  it("applies negative marking per scheme", () => {
    const s = scoreResponses([0, 1, null, 2], [0, 0, 1, 2], schemeById("2-066"));
    expect(s).toMatchObject({ correct: 2, wrong: 1, skipped: 1, attempted: 3, net: 3.34, max: 8 });
    expect(scoreResponses([1, 1, 1], [0, 0, 0], schemeById("appsc")).net).toBe(-1);
    expect(scoreResponses([1], [0], schemeById("none")).net).toBe(0);
  });
});

describe("test builders", () => {
  it("publishes every source question, with live ones split by topic", () => {
    const authored = readdirSync("content/authored").reduce(
      (n, f) => n + JSON.parse(readFileSync(`content/authored/${f}`, "utf8")).questions.length,
      0,
    );
    expect(byId.size).toBe(source.length + authored);
    // "Ecosystem" is merged into "Ecology & Ecosystem": 12 source topics remain for Environment.
    expect(new Set(source.map((q) => q.topic === "Ecosystem" ? "Ecology & Ecosystem" : q.topic)).size).toBe(12);
    expect(bank.total).toBe(bank.allActive.length);
    expect(new Set(bank.allActive).size).toBe(bank.total);
  });
  it("splits topics into sets without tiny stubs", () => {
    const sets = topicSets(Array.from({ length: 52 }, (_, i) => i));
    expect(topicSets(bank.topics[0].qids).flat()).toEqual(bank.topics[0].qids);
    expect(sets.map((s) => s.length)).toEqual([25, 27]);
  });
  it("full mock has 50 unique questions spread across topics", () => {
    const m = fullMock(bank, "appsc");
    expect(new Set(m.qids).size).toBe(50);
    expect(new Set(m.qids.map((id) => byId.get(id)!.topic)).size).toBeGreaterThan(8);
    // Equal seats per subject: no subject should dominate a multi-subject mock.
    const per = new Map<string, number>();
    for (const id of m.qids) per.set(bank.topicOf.get(id)!.subject, (per.get(bank.topicOf.get(id)!.subject) ?? 0) + 1);
    expect(Math.max(...per.values())).toBeLessThanOrEqual(Math.ceil(50 / per.size) + 1);
    expect(m.qids.every(bank.isActive)).toBe(true);
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
    const q1 = byId.get(1)!;
    useSession.getState().choose(q1.answerIndex);
    useSession.getState().saveNext();
    useSession.getState().tick(5000);
    const id = useSession.getState().submit(byId)!;
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
    const q = byId.get(1)!.question;
    const blocks = splitStatements(q);
    expect(blocks.filter((b) => b.kind === "item").map((b) => b.label)).toEqual(["1", "2", "3"]);
    expect(blocks.at(-1)!.text).toMatch(/^How many/);
    const strip = (x: string) => x.replace(/\s|\d\./g, "");
    expect(strip(blocks.map((b) => b.text).join(""))).toBe(strip(q));
  });
  it("never loses text on any question in the bank", () => {
    const strip = (x: string) => x.replace(/\s/g, "");
    for (const q of byId.values()) {
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

describe("content corrections", () => {
  const live = () => bank.allActive.map((id) => byId.get(id)!);
  it("never changes a keyed answer (beyond stripping watermarks)", () => {
    for (const src of source) {
      if (fixes.overrides?.[src.id]) continue; // reviewed rewrites are checked below
      const out = byId.get(src.id)!;
      const strip = (x: string) => x.replace(/\s*\b\d{0,3}\s*YCT\b/g, "").replace(/\s+/g, " ").trim();
      expect(strip(out.options[out.answerIndex]), `id ${src.id}`).toBe(strip(src.options[src.answerIndex]));
    }
  });
  it("applies every editorial override and puts the question back in play", () => {
    for (const [id, o] of Object.entries(fixes.overrides as Record<string, { question?: string; answerIndex?: number }>)) {
      const q = byId.get(Number(id))!;
      expect(bank.isActive(Number(id))).toBe(true);
      expect(q.revised).toBeTruthy();
      if (o.question) expect(q.question).toBe(o.question);
      if (o.answerIndex != null) expect(q.answerIndex).toBe(o.answerIndex);
    }
  });
  it("keeps withdrawn questions out of every live pool", () => {
    for (const id of Object.keys(fixes.quarantine).map(Number)) {
      expect(bank.isActive(id)).toBe(false);
      expect(byId.get(id)!.status).toBe("withdrawn");
    }
  });
  it("leaves no watermark or 'Question not attempted' option in live questions", () => {
    for (const q of live()) {
      expect([q.question, ...q.options, q.explanation, q.source].join(" ")).not.toMatch(/\bYCT\b|TCPDF/);
      expect(q.options.some((o) => /question not attempt/i.test(o))).toBe(false);
    }
  });
});

describe("authored questions", () => {
  it("belong to catalog subjects and syllabus units, with unique ids", async () => {
    const { SUBJECTS } = await import("@/content/catalog");
    for (const t of bank.topics) {
      expect(SUBJECTS[t.subject], `subject ${t.subject}`).toBeTruthy();
      if (t.subject !== "env" && t.unit != null) {
        expect(SUBJECTS[t.subject].units[t.unit - 1]?.title, `${t.subject} unit ${t.unit}`).toBe(t.name);
      }
    }
    const ids = bank.topics.flatMap((t) => t.all);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("cover more than one subject and scope by exam", async () => {
    const { scopeBank } = await import("@/lib/bank");
    const { subjectsForExam } = await import("@/content/catalog");
    expect(bank.subjects.length).toBeGreaterThan(5);
    const g2 = scopeBank(bank, subjectsForExam("group2").map((s) => s.id));
    expect(g2.topics.every((t) => subjectsForExam("group2").some((s) => s.id === t.subject))).toBe(true);
    expect(g2.topics.some((t) => t.subject === "engg-core")).toBe(false);
  });
});

describe("spaced repetition", () => {
  const DAY = 86_400_000;
  it("enters on a wrong answer and graduates after five right answers", () => {
    let s = review({ n: 1, c: 0, last: false, at: 0 }, false, 0);
    expect(s.box).toBe(0);
    expect(isDue(s, 0)).toBe(true);
    for (let i = 1; i < INTERVAL_DAYS.length; i++) {
      s = review(s, true, 0);
      expect(s.box).toBe(i);
      expect(s.due).toBe(INTERVAL_DAYS[i] * DAY);
      expect(isDue(s, 0)).toBe(false);
    }
    s = review(s, true, 0);
    expect(inRevision(s)).toBe(false);
  });
  it("a right answer outside the revision set changes nothing", () => {
    expect(inRevision(review({ n: 1, c: 1, last: true, at: 0 }, true, 0))).toBe(false);
  });
  it("tests feed the revision set", () => {
    useApp.getState().resetAll();
    useSession.getState().start(topicSetTest("Pollution", 0, [1], "practice", "appsc"));
    useSession.getState().begin();
    useSession.getState().choose((byId.get(1)!.answerIndex + 1) % byId.get(1)!.options.length);
    useSession.getState().submit(byId);
    expect(useApp.getState().qstats[1].box).toBe(0);
  });
});

describe("storage migration v1 → v2", () => {
  it("moves wrong answers into the revision set and remaps retired exams", () => {
    const out = migrateApp(
      { profile: { name: "", examId: "allied", createdAt: 1 }, qstats: { 5: { n: 1, c: 0, last: false, at: 9 }, 6: { n: 1, c: 1, last: true, at: 9 } } },
      1,
    ) as { profile: { examId: string }; qstats: Record<number, { box?: number; due?: number }> };
    expect(out.profile.examId).toBe("aswo");
    expect(out.qstats[5]).toMatchObject({ box: 0, due: 9 });
    expect(out.qstats[6].box).toBeUndefined();
  });
});
