import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { loadBank, loadQuestions, setBankFetcher, type LoadedBank } from "@/lib/bank";
import { chapterWeight, PATTERNS } from "@/content/patterns";
import { patternMock } from "@/lib/tests";

setBankFetcher(async (path) => JSON.parse(readFileSync(`public/data/${path}`, "utf8")));
let bank: LoadedBank;
beforeAll(async () => {
  bank = await loadBank();
});

const numIds = () => new Set(bank.topics.filter((t) => t.subject === "numericals").flatMap((t) => t.qids));
const build = (id: string) => patternMock(bank, PATTERNS.find((p) => p.id === id)!, chapterWeight);

describe("Technical Subjects Numericals", () => {
  it("is one subject whose topics are '<Subject> · <formula family>'", () => {
    const topics = bank.topics.filter((t) => t.subject === "numericals");
    expect(topics.length).toBeGreaterThan(60);
    for (const t of topics) expect(t.name).toMatch(/^.+ · .+$/);
    expect(new Set(topics.map((t) => t.name.split(" · ")[0])).size).toBeGreaterThan(12);
  });
  it("no numerical stays in a theory chapter", async () => {
    const nums = numIds();
    expect(nums.size).toBeGreaterThan(1000);
    for (const t of bank.topics.filter((x) => x.subject !== "numericals")) for (const id of t.qids) expect(nums.has(id)).toBe(false);
  });
  it("every numerical shows its formula family, and unsolved ones point to the book page and question number", async () => {
    const ids = [...numIds()];
    const qs = await loadQuestions(ids);
    let unsolved = 0;
    for (const id of ids) {
      const q = qs.get(id)!;
      expect(q.numerical).toBe(true);
      expect(q.explanation).toMatch(/Formula family:/);
      if (/not recovered cleanly/.test(q.explanation)) {
        unsolved++;
        expect(q.explanation, `#${id}`).toMatch(/Refer to the book: .*p\.\d+/);
      }
    }
    expect(unsolved).toBeGreaterThan(0);
  });
});

describe("mock composition with numericals", () => {
  const count = (qids: number[]) => qids.filter((id) => numIds().has(id)).length;
  it("AEE Paper-II: 35 numericals each in SOM and FM, 150 questions", () => {
    const p = PATTERNS.find((x) => x.id === "aee-civil-p2")!;
    expect(p.sections.map((s) => s.seats)).toEqual([40, 35, 40, 35]);
    const t = build("aee-civil-p2");
    expect(t.qids).toHaveLength(150);
    expect(count(t.qids)).toBe(70);
  });
  it("AEE Paper-III keeps its 150-seat composition with about 30 numericals", () => {
    const p = PATTERNS.find((x) => x.id === "aee-civil-p3")!;
    expect(p.sections.reduce((n, x) => n + x.seats, 0)).toBe(150);
    const t = build("aee-civil-p3");
    expect(t.qids).toHaveLength(150);
    expect(count(t.qids)).toBeGreaterThanOrEqual(25);
    expect(count(t.qids)).toBeLessThanOrEqual(35);
  });
  it("AEE PCB Paper-II uses only five numericals", () => {
    expect(count(build("aee-pcb-p3").qids)).toBe(5);
  });
  it("other papers use no numericals", () => {
    for (const id of ["aee-civil-p1", "aee-prtw-p3", "draughtsman-p2", "g2-screening", "ssc-je-p2"]) expect(count(build(id).qids), id).toBe(0);
  });
});
