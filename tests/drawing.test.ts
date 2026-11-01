import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SUBJECTS } from "@/content/catalog";
import { PATTERNS } from "@/content/patterns";

type Q = { id: string; exam: string[]; subjectId: string; topic: string; unit: number; question: string; options: string[]; answerIndex: number; explanation: string };
const qs: Q[] = JSON.parse(readFileSync("data/questions/engineering-drawing.json", "utf8"));
const units = SUBJECTS["drawing-survey"].units;

describe("Engineering Drawing bank (AEE PR & TW Paper-3 and Draughtsman Paper-II)", () => {
  it("keeps each question on a syllabus unit and gives it the exams that list that unit", () => {
    expect(qs.length).toBeGreaterThan(500);
    for (const q of qs) {
      expect(q.subjectId).toBe("drawing-survey");
      expect(q.unit).toBeGreaterThanOrEqual(1);
      expect(q.unit).toBeLessThanOrEqual(14);
      expect(units[q.unit - 1].title).toBe(q.topic);
      expect(q.exam).toEqual(units[q.unit - 1].exams);
      expect(q.explanation.length).toBeGreaterThan(5);
      expect([2, 4]).toContain(q.options.length);
    }
  });

  it("serves Draughtsman only its own units and AEE PR & TW only theirs in the real-pattern mocks", () => {
    const sec = (id: string) => PATTERNS.find((p) => p.id === id)!.sections.find((s) => s.subjects.includes("drawing-survey"))!;
    const dm = sec("draughtsman-p2").units!;
    const aee = sec("aee-prtw-p3").units!;
    for (const u of dm) expect(units[u - 1].exams).toContain("draughtsman");
    for (const u of aee) expect(units[u - 1].exams).toContain("aee-prtw");
    expect(dm).not.toContain(5); // conic sections: AEE only
    expect(aee).not.toContain(3); // dimensioning: Draughtsman only
  });

  it("has enough questions in each unit set aside for the 15-question section", () => {
    const count = (list: number[]) => qs.filter((q) => list.includes(q.unit)).length;
    expect(count([1, 2, 3, 4, 7])).toBeGreaterThanOrEqual(15);
    expect(count([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])).toBeGreaterThanOrEqual(15);
  });
});
