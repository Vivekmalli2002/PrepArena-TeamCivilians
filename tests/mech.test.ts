import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { papersForExam, subjectsForExam } from "@/content/catalog";

type Q = { id: string; exam: string[]; subjectId: string; topic: string; unit: number; source: string; options: string[]; answerIndex: number };
const load = (f: string): Q[] => JSON.parse(readFileSync(`data/questions/${f}.json`, "utf8"));

describe("AEE PCB Paper-II Mechanical banks", () => {
  const mat = load("mech-materials");
  const thermo = load("mech-thermo");

  it("keeps only the chapters of the notified topics, in book order", () => {
    expect([...new Set(mat.map((q) => q.topic))]).toEqual([
      "Material Properties", "Atomic Structures, Crystallography and Phase Diagrams", "Mechanical Testing", "Heat Treatment Process", "Engineering Materials",
    ]);
    expect([...new Set(thermo.map((q) => q.topic))]).toEqual([
      "Basic Concepts & Zeroth Law of Thermodynamics", "First Law of Thermodynamics", "Second Law of Thermodynamics", "Entropy",
      "Availability and Irreversibility", "Properties of Pure Substances, Gases and Gas Mixture", "Thermodynamic Relations",
    ]);
    for (const q of [...mat, ...thermo]) expect(q.unit).toBeGreaterThanOrEqual(1);
  });

  it("belongs to the Pollution Control Board exam only, with a clean source line", () => {
    for (const q of [...mat, ...thermo]) {
      expect(q.exam).toEqual(["aee-pcb"]);
      expect(q.source).toMatch(/Mechanical Engg\. Vol-[12] p\.\d+/);
      expect(q.source).not.toMatch(/YCT/);
      expect(new Set(q.options).size).toBe(4);
    }
    expect(new Set(mat.map((q) => q.subjectId))).toEqual(new Set(["mech-mat"]));
    expect(new Set(thermo.map((q) => q.subjectId))).toEqual(new Set(["mech-thermo"]));
  });

  it("is part of the AEE PCB Paper-II subjects and not of the civil exams", () => {
    const pcb = subjectsForExam("aee-pcb").map((s) => s.id);
    expect(pcb).toContain("mech-mat");
    expect(pcb).toContain("mech-thermo");
    expect(subjectsForExam("aee-rbi").map((s) => s.id)).not.toContain("mech-mat");
    expect(papersForExam("aee-pcb").some((p) => p.subjects.includes("mech-thermo"))).toBe(true);
  });
});
