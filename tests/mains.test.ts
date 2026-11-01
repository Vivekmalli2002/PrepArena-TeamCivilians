import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bySubject, importance, nextTheme, studyOrder, sumProgress, themeDone, themeProgress, type Theme } from "@/lib/checklist";
import { emptyLearn, readKey, toggleRead, unreadItems } from "@/lib/mainsLearn";

const J = (f: string) => JSON.parse(readFileSync(`src/content/${f}`, "utf8"));
const MODEL_FILES = ["p5", "p4", "p3p2", "f1", "f2", "f3", "f4", "f5", "g23", "g45", "s1", "s2"].map((n) => J(`mains-model-${n}.json`));
const THEMES = J("mains-checklist.json") as Theme[];

describe("checklist data", () => {
  it("covers all five papers with unique theme and question ids", () => {
    expect([...new Set(THEMES.map((t) => t.paper))].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    const ids = THEMES.flatMap((t) => t.expected.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(THEMES.reduce((n, t) => n + t.n, 0)).toBeGreaterThan(1100);
    expect(THEMES.filter((t) => t.kind === "upsc").every((t) => t.expected.length === 0)).toBe(true);
  });
  it("never expects more than 10 questions in a theme, and fewer for small themes", () => {
    for (const t of THEMES) {
      expect(t.expected.length, t.label).toBeLessThanOrEqual(10);
      if (t.n <= 2 && !t.legacy) expect(t.expected.length, t.label).toBeLessThanOrEqual(Math.max(2, t.expected.filter((e) => e.model).length));
    }
  });
  it("ranks a theme's importance by the questions the PDF lists under its microtheme", () => {
    const top = [...THEMES].sort((a, b) => b.pdfn - a.pdfn)[0];
    expect(top.pdfn).toBeGreaterThanOrEqual(20);
    expect(importance(top).label).toBe("Very high");
    expect(importance({ pdfn: 1 }).label).toBe("Low");
    expect(importance({ pdfn: 4 }).label).toBe("Medium");
    expect(importance({ pdfn: 7 }).label).toBe("High");
  });
  it("keeps questions asked only by other exams apart from APPSC ones", () => {
    const only = THEMES.flatMap((t) => t.asked).filter((a) => a.boards.length > 0 && !a.boards.includes("APPSC"));
    expect(only.length).toBeGreaterThan(900);
    expect(only.every((a) => a.boards.includes("TGPSC") || a.boards.includes("UPSC"))).toBe(true);
    expect(only.filter((a) => a.boards.includes("UPSC")).length).toBeGreaterThan(700);
    expect(THEMES.filter((t) => t.asked.some((a) => a.boards.length > 0 && !a.boards.includes("APPSC"))).length).toBeGreaterThan(50);
  });
  it("lists the past questions with their years and boards", () => {
    const tg = THEMES.flatMap((t) => t.asked).filter((a) => a.boards.includes("TGPSC"));
    expect(tg.length).toBeGreaterThan(50);
    for (const t of THEMES) for (const a of t.asked) expect(a.q.length, t.label).toBeGreaterThan(10);
  });
  it("attaches every hand-written model answer to an expected question", () => {
    const attached = new Set(THEMES.flatMap((t) => t.expected.filter((e) => e.model).map((e) => e.id)));
    for (const m of MODEL_FILES.flat() as { id: string }[]) expect(attached.has(m.id), m.id).toBe(true);
  });
});

describe("progress and the next theme", () => {
  const order = studyOrder(THEMES);
  it("studies paper by paper, most-asked theme first, and skips themes with nothing to tick", () => {
    expect(order.every((t) => t.expected.length > 0 && !t.legacy)).toBe(true);
    const papers = order.map((t) => t.paper);
    expect([...papers].sort()).toEqual(papers);
    const g = bySubject(THEMES, 5)[0].themes.filter((t) => !t.label.startsWith("Misc"));
    for (let i = 1; i < g.length; i++) expect(g[i - 1].pdfn).toBeGreaterThanOrEqual(g[i].pdfn);
  });
  it("a theme is finished when all its expected questions are ticked, then the next unfinished theme is offered", () => {
    const first = order[0], second = order[1];
    const done: Record<string, number> = {};
    expect(themeDone(first, done)).toBe(false);
    first.expected.forEach((e, i) => {
      done[e.id] = 1;
      expect(themeProgress(first, done).done).toBe(i + 1);
    });
    expect(themeDone(first, done)).toBe(true);
    expect(nextTheme(order, first.id, done)?.id).toBe(second.id);
    expect(nextTheme(order, null, done)?.id).toBe(second.id);
    second.expected.forEach((e) => (done[e.id] = 1));
    expect(nextTheme(order, first.id, done)?.id).toBe(order[2].id);
  });
  it("returns null when every theme is done and sums progress", () => {
    const done: Record<string, number> = {};
    for (const t of order) for (const e of t.expected) done[e.id] = 1;
    expect(nextTheme(order, order[0].id, done)).toBeNull();
    const p = sumProgress(order, done);
    expect(p.done).toBe(p.total);
  });
});

describe("expected questions and reading checklist", () => {
  const files = MODEL_FILES.flat() as { id: string; paper: number; question: string; intro: string; body: { h: string; pts: string[] }[]; conclusion: string; updates?: string[] }[];
  it("every expected question has an intro, a body and a conclusion; ids are unique", () => {
    expect(files.length).toBeGreaterThanOrEqual(70);
    expect(new Set(files.map((m) => m.id)).size).toBe(files.length);
    for (const m of files) {
      expect(m.intro.length, m.id).toBeGreaterThan(60);
      expect(m.body.length, m.id).toBeGreaterThan(0);
      expect(m.conclusion.length, m.id).toBeGreaterThan(40);
    }
  });
  it("APPSC-style answers carry many short points and fit about 12 minutes (200–400 words)", () => {
    const appsc = (MODEL_FILES.flat() as { id: string; style?: string; intro: string; body: { pts: string[] }[]; conclusion: string }[]).filter((m) => m.style === "appsc");
    expect(appsc.length).toBeGreaterThanOrEqual(10);
    for (const m of appsc) {
      const words = (m.intro + " " + m.body.map((b) => b.pts.join(" ")).join(" ") + " " + m.conclusion).split(/\s+/).filter(Boolean).length;
      expect(words, m.id).toBeGreaterThanOrEqual(200);
      expect(words, m.id).toBeLessThanOrEqual(400);
      expect(m.body.reduce((n, b) => n + b.pts.length, 0), m.id).toBeGreaterThanOrEqual(12);
    }
  });
  it("keeps a question pending until every current-affairs item is ticked", () => {
    const q = { id: "m-x", updates: ["a", "b", "c"] };
    let s = emptyLearn();
    expect(unreadItems(q, s.read)).toEqual([0, 1, 2]);
    s = toggleRead(s, readKey("m-x", 1));
    expect(unreadItems(q, s.read)).toEqual([0, 2]);
    s = toggleRead(toggleRead(s, readKey("m-x", 0)), readKey("m-x", 2));
    expect(unreadItems(q, s.read)).toEqual([]);
    s = toggleRead(s, readKey("m-x", 1)); // untick again
    expect(unreadItems(q, s.read)).toEqual([1]);
  });
});
