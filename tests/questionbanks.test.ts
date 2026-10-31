import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = "data/questions";
const files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith(".dropped.json") && !f.startsWith("_"));

describe("structured question banks (data/questions)", () => {
  const seen = new Set<string>();
  for (const f of files) {
    const items = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    it(`${f}: well-formed, unique, images present`, () => {
      expect(items.length).toBeGreaterThan(0);
      for (const q of items) {
        expect(seen.has(q.id), `duplicate id ${q.id}`).toBe(false);
        seen.add(q.id);
        expect(q.question.length).toBeGreaterThan(10);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.answerIndex).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex).toBeLessThan(q.options.length);
        expect(q.exam.length).toBeGreaterThan(0);
        for (const img of [...(q.explanationImage ?? []), ...(q.image ? [q.image] : [])]) {
          expect(existsSync(`public/qimg/${f.replace(".json", "")}/${img}`), img).toBe(true);
        }
        // a conflicting source key must be flagged, never silent
        if (q.keyCheck?.startsWith("conflict") || q.keyCheck === "source-only") expect(q.flag).toBeTruthy();
      }
      expect(new Set(items.map((q: { question: string; options: string[] }) => q.question + "|" + q.options.join("|"))).size).toBe(items.length);
    });
  }
});
