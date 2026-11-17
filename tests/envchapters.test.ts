import { describe, expect, it } from "vitest";
import env from "../data/env-topics.json";

const rows = Object.values(env as unknown as Record<string, [string, number | null]>);
const count = new Map<string, number>();
for (const [name] of rows) count.set(name, (count.get(name) ?? 0) + 1);

describe("Environmental Science is grouped into the PCB AEE syllabus chapters", () => {
  it("files every question under a numbered chapter of one of the 10 syllabus units", () => {
    for (const [name, unit] of rows) {
      if (name === "Environment: unclassified") continue;
      const m = /^(\d+)\.(\d+) /.exec(name);
      expect(m, name).not.toBeNull();
      expect(unit, name).toBe(Number(m![1]));
      expect(unit!).toBeGreaterThanOrEqual(1);
      expect(unit!).toBeLessThanOrEqual(10);
    }
  });
  it("covers all ten units", () => {
    const units = new Set(rows.map(([, u]) => u));
    for (let u = 1; u <= 10; u++) expect(units.has(u), `unit ${u}`).toBe(true);
  });
  it("keeps the leftover buckets small and no chapter is a catch-all", () => {
    const left = rows.filter(([n]) => /other questions$|unclassified$/.test(n)).length;
    expect(left / rows.length).toBeLessThan(0.1);
    for (const [name, n] of count) expect(n, name).toBeLessThan(0.15 * rows.length);
  });
  it("has the syllabus chapters a learner expects", () => {
    const names = [...count.keys()].join("\n").toLowerCase();
    for (const w of ["ecological succession", "biogeochemical cycles", "wastewater treatment", "noise pollution", "acid rain", "environmental impact assessment", "rainwater harvesting", "sendai framework"])
      expect(names).toContain(w);
  });
});
