import { describe, expect, it } from "vitest";
import gs from "../data/gs-topics.json";

const topics = new Map<string, number>();
for (const t of Object.values(gs as Record<string, string>)) topics.set(t, (topics.get(t) ?? 0) + 1);

describe("YCT general-studies topics are segregated", () => {
  it("has no catch-all topic larger than 500 questions", () => {
    for (const [name, n] of topics) expect(n, name).toBeLessThan(500);
  });
  it("splits history, geography, science and environment into many chapters", () => {
    for (const w of ["Ancient", "Modern", "Geography", "Physics", "Biology", "Protected areas", "Climate change"])
      expect([...topics.keys()].some((k) => k.includes(w)), w).toBe(true);
    expect(topics.size).toBeGreaterThanOrEqual(60);
  });
  it("keeps the leftover 'other questions' buckets small", () => {
    const total = [...topics.values()].reduce((a, b) => a + b, 0);
    const other = [...topics].filter(([k]) => k.endsWith("other questions")).reduce((a, [, n]) => a + n, 0);
    expect(other / total).toBeLessThan(0.12);
  });
  it("does not touch the old coarse topic names", () => {
    for (const old of ["Personalities & miscellaneous modern India", "General science & miscellaneous", "World geography & miscellaneous"])
      expect(topics.has(old), old).toBe(false);
  });
});
