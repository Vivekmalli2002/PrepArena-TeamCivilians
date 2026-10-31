import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { loadBank, setBankFetcher, type LoadedBank } from "@/lib/bank";
import { chapterWeight, PATTERNS } from "@/content/patterns";
import { allocate, customTest, patternMock } from "@/lib/tests";

setBankFetcher(async (path) => JSON.parse(readFileSync(`public/data/${path}`, "utf8")));
let bank: LoadedBank;
beforeAll(async () => {
  bank = await loadBank();
});

const chapters: { n: number; name: string; chapters: { name: string }[] }[] = JSON.parse(readFileSync("data/civil-chapters.json", "utf8"));

describe("civil chapter list", () => {
  it("every civil topic is a chapter from the supplied list (or the Miscellaneous / other buckets)", () => {
    const listed = new Map(chapters.map((s) => [s.name, new Set(s.chapters.map((c) => c.name))]));
    const subjectName = new Map(bank.subjects.map((s) => [s.id, s.name]));
    for (const t of bank.topics.filter((x) => x.subject.startsWith("civil-") && x.subject !== "civil-other")) {
      const chs = listed.get(subjectName.get(t.subject)!);
      expect(chs, `subject ${t.subject}`).toBeTruthy();
      const plain = t.name.replace(/ \(.+\)$/, "");
      expect(chs!.has(t.name) || chs!.has(plain) || plain === "Miscellaneous", `${t.subject}: ${t.name}`).toBe(true);
    }
  });
  it("lists chapters in the order of the document", () => {
    for (const s of chapters) {
      const topics = bank.topics.filter((t) => bank.subjects.find((x) => x.id === t.subject)?.name === s.name && t.unit != null);
      const units = topics.map((t) => t.unit!);
      expect(units).toEqual([...units].sort((a, b) => a - b));
    }
  });
});

describe("allocate", () => {
  it("splits by weight, respects caps and hands surplus on", () => {
    expect(allocate([1, 1], [100, 100], 10)).toEqual([5, 5]);
    expect(allocate([3, 1], [100, 100], 8)).toEqual([6, 2]);
    expect(allocate([1, 1, 1], [2, 100, 100], 10)).toEqual([2, 4, 4]);
    expect(allocate([1, 1], [3, 4], 50)).toEqual([3, 4]);
    expect(allocate([1, 2], [5, 5], 0)).toEqual([0, 0]);
  });
});

describe("exam-pattern mocks", () => {
  it("builds a 150-question AEE Paper-3 with no repeats and follows the section split", () => {
    const p = PATTERNS.find((x) => x.id === "aee-civil-p3")!;
    expect(p.sections.reduce((n, s) => n + s.seats, 0)).toBe(150);
    const t = patternMock(bank, p, chapterWeight);
    expect(t.qids).toHaveLength(150);
    expect(new Set(t.qids).size).toBe(150);
    expect(t.durationSec).toBe(150 * 60);
    expect(t.mode).toBe("exam");
    const subj = new Map(bank.topics.flatMap((x) => x.qids.map((id) => [id, x.subject] as const)));
    for (const s of p.sections.filter((x) => !x.chapters)) {
      expect(t.qids.filter((id) => s.subjects.includes(subj.get(id)!)).length).toBe(s.seats);
    }
  });
  it("Group-2 screening is five sections of 30", () => {
    const p = PATTERNS.find((x) => x.id === "g2-screening")!;
    expect(p.sections.map((s) => s.seats)).toEqual([30, 30, 30, 30, 30]);
    expect(patternMock(bank, p, chapterWeight).qids).toHaveLength(150);
  });
  it("custom seats are honoured and a short section hands seats on", () => {
    const p = PATTERNS.find((x) => x.id === "aee-civil-p3")!;
    const small = { ...p, sections: p.sections.map((s) => ({ ...s, seats: 1 })) };
    expect(patternMock(bank, small, chapterWeight).qids).toHaveLength(p.sections.length);
  });
  it("custom test can take every question of the chosen chapters, weighted or not", () => {
    const topics = bank.topics.filter((t) => t.subject === "civil-geo").map((t) => t.name);
    const total = bank.topics.filter((t) => t.subject === "civil-geo").reduce((n, t) => n + t.qids.length, 0);
    for (const weight of [undefined, chapterWeight]) {
      const t = customTest(bank, { topics, count: total, minutes: 0, mode: "practice", schemeId: "appsc", pool: "all", weight }, {}, [])!;
      expect(new Set(t.qids).size).toBe(total);
    }
  });
});

describe("custom test split across topics", () => {
  const geo = () => bank.topics.filter((t) => t.subject === "civil-geo" && t.qids.length >= 30).slice(0, 3);
  it("follows a ratio and caps at what a topic holds", () => {
    const ts = geo();
    const values = { [ts[0].name]: 3, [ts[1].name]: 2, [ts[2].name]: 1 };
    const t = customTest(bank, { topics: ts.map((x) => x.name), count: 30, minutes: 30, mode: "practice", schemeId: "appsc", pool: "all", split: { how: "ratio", values } }, {}, [])!;
    const of = (n: string) => t.qids.filter((id) => bank.topicOf.get(id)!.name === n).length;
    expect([of(ts[0].name), of(ts[1].name), of(ts[2].name)]).toEqual([15, 10, 5]);
  });
  it("gives exactly the typed number from each topic, and equal shares", () => {
    const ts = geo();
    const values = { [ts[0].name]: 7, [ts[1].name]: 0, [ts[2].name]: 4 };
    const t = customTest(bank, { topics: ts.map((x) => x.name), count: 0, minutes: 0, mode: "practice", schemeId: "appsc", pool: "all", split: { how: "exact", values } }, {}, [])!;
    expect(t.qids).toHaveLength(11);
    const e = customTest(bank, { topics: ts.map((x) => x.name), count: 9, minutes: 9, mode: "practice", schemeId: "appsc", pool: "all", split: { how: "equal", values: {} } }, {}, [])!;
    expect(e.qids).toHaveLength(9);
    expect(new Set(e.qids.map((id) => bank.topicOf.get(id)!.name)).size).toBe(3);
  });
});

describe("weightage from past papers", () => {
  it("is measured on real papers and sums to the questions counted", () => {
    const w = JSON.parse(readFileSync("src/content/civilWeights.json", "utf8"));
    expect(w.basis).toMatch(/past AEE/);
    const total = Object.values<{ questions: number }>(w.subjects).reduce((n, s) => n + s.questions, 0);
    expect(total).toBeGreaterThan(1500);
    const sh = Object.values<{ share: number }>(w.subjects).reduce((n, s) => n + s.share, 0);
    expect(sh).toBeGreaterThan(0.99);
    expect(sh).toBeLessThan(1.01);
  });
});
