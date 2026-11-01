import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildQueue, complete, emptyLearn, learnMore, learnStreak, readKey, rollDay, themeStats, toggleRead, topUp, uncomplete, unreadItems, type MainsQ } from "@/lib/mainsLearn";

const QS = JSON.parse(readFileSync("src/content/mains.json", "utf8")) as MainsQ[];
const J = (f: string) => JSON.parse(readFileSync(`src/content/${f}`, "utf8"));
const MODEL_FILES = ["p5", "p4", "p3p2", "f1", "f2", "f3", "f4", "f5"].map((n) => J(`mains-model-${n}.json`));
const answers = JSON.parse(readFileSync("src/content/mains-answers.json", "utf8")) as Record<string, { answer: string }>;

describe("theme ranking", () => {
  const stats = themeStats(QS);
  it("puts the most recurring theme first and 'Other' last", () => {
    expect(stats[0].count).toBeGreaterThanOrEqual(stats[1].count);
    for (let i = 1; i < stats.length - 1; i++) {
      if (stats[i].theme.startsWith("Other") || stats[i + 1].theme.startsWith("Other")) continue;
      expect(stats[i - 1].count).toBeGreaterThanOrEqual(stats[i].count);
    }
    expect(stats.reduce((n, t) => n + t.count, 0)).toBe(QS.length);
  });
  it("lists angles a theme has never been asked from", () => {
    const top = stats[0];
    expect(top.count).toBeGreaterThan(15);
    for (const d of top.unseen) expect(top.dims[d]).toBeUndefined();
  });
  it("tags every question with a theme and at least one angle", () => {
    for (const q of QS) {
      expect(q.theme, q.id).toBeTruthy();
      expect(q.dims.length, q.id).toBeGreaterThan(0);
    }
  });
});

describe("learning queue", () => {
  const queue = buildQueue(QS);
  const byId = new Map(QS.map((q) => [q.id, q]));
  it("serves every question exactly once, most recurring theme first", () => {
    expect(queue).toHaveLength(QS.length);
    expect(new Set(queue).size).toBe(QS.length);
    expect(byId.get(queue[0])!.theme).toBe(themeStats(QS)[0].theme);
  });
  it("meets a theme from different angles before repeating one", () => {
    const first = themeStats(QS)[0];
    const firstFive = queue.slice(0, 5).map((id) => byId.get(id)!);
    expect(firstFive.every((q) => q.theme === first.theme)).toBe(true);
    const covered = new Set(firstFive.flatMap((q) => q.dims));
    expect(covered.size).toBeGreaterThanOrEqual(Math.min(4, new Set(QS.filter((q) => q.theme === first.theme).flatMap((q) => q.dims)).size));
  });
  it("answers, when supplied, belong to known questions", () => {
    for (const id of Object.keys(answers)) expect(byId.has(id), id).toBe(true);
  });
});

describe("daily rollover and backlog", () => {
  const queue = ["a", "b", "c", "d", "e", "f"];
  it("serves one to three questions a day", () => {
    let s = rollDay({ ...emptyLearn(), perDay: 2 }, "2026-11-02", queue);
    expect(s.today).toEqual(["a", "b"]);
    s = rollDay(s, "2026-11-02", queue);
    expect(s.today).toEqual(["a", "b"]); // same day: nothing changes
    s = topUp({ ...s, perDay: 3 }, queue);
    expect(s.today).toEqual(["a", "b", "c"]);
  });
  it("sends what was not completed to the end of the line the next day", () => {
    let s = rollDay({ ...emptyLearn(), perDay: 2 }, "2026-11-02", queue);
    s = complete(s, "a");
    s = rollDay(s, "2026-11-03", queue);
    expect(s.today).toEqual(["c", "d"]); // next fresh questions, not 'b'
    expect(s.backlog).toEqual(["b"]);
  });
  it("serves the backlog once the fresh questions run out, and completing clears it", () => {
    let s = rollDay({ ...emptyLearn(), perDay: 3 }, "d1", ["a", "b", "c", "d"]);
    s = complete(s, "a");
    s = rollDay(s, "d2", ["a", "b", "c", "d"]);
    expect(s.today).toEqual(["d", "b", "c"]); // d is fresh, then the backlog in order
    expect(s.backlog).toEqual([]);
    s = complete(s, "b");
    expect(s.done.b).toBeTruthy();
    s = uncomplete(s, "b");
    expect(s.done.b).toBeUndefined();
  });
  it("'learn one more' adds a question beyond the daily number", () => {
    let s = rollDay({ ...emptyLearn(), perDay: 1 }, "d1", queue);
    s = learnMore(complete(s, "a"), queue);
    expect(s.today).toEqual(["a", "b"]);
  });
  it("counts a streak of consecutive days with something completed", () => {
    const at = (k: string) => new Date(k + "T10:00").getTime();
    const dayOf = (t: number) => {
      const d = new Date(t);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const done = { a: at("2026-11-01"), b: at("2026-11-02"), c: at("2026-11-03"), x: at("2026-10-28") };
    expect(learnStreak(done, "2026-11-03", dayOf)).toBe(3);
    expect(learnStreak(done, "2026-11-04", dayOf)).toBe(3); // today not started yet: yesterday still counts
    expect(learnStreak(done, "2026-11-06", dayOf)).toBe(0);
  });
});

describe("question set", () => {
  it("is the Group-I Mains compilation (Papers I–V, 2008–2025) with unique ids", () => {
    expect(QS.length).toBeGreaterThan(800);
    expect(new Set(QS.map((q) => q.id)).size).toBe(QS.length);
    expect([...new Set(QS.map((q) => q.paper))].sort()).toEqual([1, 2, 3, 4, 5]);
    for (const q of QS) expect(q.theme, q.id).toBeTruthy();
    for (const q of QS) expect(q.question, q.id).not.toMatch(/^\d+\s*\([a-z]\)|\s\d{1,2}\([a-d]\)(\s|$)/);
  });
});

describe("expected questions and reading checklist", () => {
  const files = MODEL_FILES.flat() as { id: string; paper: number; question: string; intro: string; body: { h: string; pts: string[] }[]; conclusion: string; updates?: string[] }[];
  it("every expected question has an intro, a body and a conclusion; ids are unique", () => {
    expect(files.length).toBeGreaterThanOrEqual(45);
    expect(new Set(files.map((m) => m.id)).size).toBe(files.length);
    for (const m of files) {
      expect(m.intro.length, m.id).toBeGreaterThan(60);
      expect(m.body.length, m.id).toBeGreaterThan(0);
      expect(m.conclusion.length, m.id).toBeGreaterThan(40);
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
