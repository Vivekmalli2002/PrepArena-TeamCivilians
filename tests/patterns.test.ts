import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { loadBank, setBankFetcher, type LoadedBank } from "@/lib/bank";
import { chapterWeight, PATTERNS } from "@/content/patterns";
import { allocate, customTest, patternMock, scaleSeats } from "@/lib/tests";

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

describe("exam blueprints", () => {
  it("add up to the question counts of the papers", () => {
    const want: Record<string, number> = { "g1-p1": 120, "g1-p2": 120, "g2-screening": 150, "g2-mains-1": 150, "g2-mains-2": 150, "aee-pcb-p1": 150, "aee-pcb-p3": 150, "aee-civil-p1": 150, "aee-civil-p2": 150, "aee-civil-p3": 150, "aswo-p1": 150, "aswo-p2": 150, "aswo-p3": 150, "eo-p1": 150, "eo-p2": 150, "aee-prtw-p3": 150, "draughtsman-p1": 150, "draughtsman-p2": 150, "ssc-je-p1": 200, "ssc-je-p2": 300 };
    for (const [id, n] of Object.entries(want)) {
      const p = PATTERNS.find((x) => x.id === id)!;
      expect(p, id).toBeTruthy();
      expect(p.sections.reduce((k, x) => k + x.seats, 0), id).toBe(n);
    }
  });
  it("gives AEE PR & TW its own Paper-III (not civil), ASWO three papers and Draughtsman two", () => {
    const prtw = PATTERNS.find((x) => x.id === "aee-prtw-p3")!;
    expect(prtw.exams).toEqual(["aee-prtw"]);
    expect(prtw.sections.some((x) => x.subjects.some((id) => id.startsWith("civil-")))).toBe(false);
    expect(prtw.sections.filter((x) => x.label.startsWith("Env. Science")).reduce((n, x) => n + x.seats, 0)).toBe(90);
    expect(PATTERNS.find((x) => x.id === "aee-civil-p3")!.exams).toEqual(["aee-rbi"]);
    expect(PATTERNS.find((x) => x.id === "aee-civil-p2")!.exams).toEqual(["aee-rbi", "aee-prtw"]);
    expect(PATTERNS.filter((x) => x.exams.includes("aswo")).map((x) => x.id)).toEqual(["aswo-p1", "aswo-p2", "aswo-p3"]);
    expect(PATTERNS.find((x) => x.id === "aswo-p2")!.sections.map((x) => x.seats)).toEqual([135, 15]);
    expect(PATTERNS.find((x) => x.id === "aswo-p3")!.sections.map((x) => x.seats)).toEqual([135, 15]);
    expect(PATTERNS.filter((x) => x.exams.includes("draughtsman")).map((x) => x.id)).toEqual(["draughtsman-p1", "draughtsman-p2"]);
    expect(PATTERNS.find((x) => x.id === "draughtsman-p2")!.sections.map((x) => x.seats)).toEqual([90, 15, 45]);
  });
  it("scales proportionally to a smaller test and keeps every part represented", () => {
    const p = PATTERNS.find((x) => x.id === "g2-screening")!;
    expect(scaleSeats(bank, p, 50).reduce((a, b) => a + b, 0)).toBe(50);
    expect(scaleSeats(bank, p, 50)).toEqual([10, 10, 10, 10, 10]);
    const aee = PATTERNS.find((x) => x.id === "aee-civil-p3")!;
    const seats = scaleSeats(bank, aee, 30);
    expect(seats.reduce((a, b) => a + b, 0)).toBe(30);
    expect(seats[0]).toBe(3); // Strength of Materials: 15/150 of 30
    expect(seats.at(-1)).toBe(1); // Construction Materials & Management: 5/150 of 30
  });
  it("the AEE Paper-I bank-backed sections are filled and no question repeats", () => {
    const p = PATTERNS.find((x) => x.id === "aee-pcb-p1")!;
    const t = patternMock(bank, p, chapterWeight);
    expect(new Set(t.qids).size).toBe(t.qids.length);
    expect(t.qids.length).toBeGreaterThan(140);
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
