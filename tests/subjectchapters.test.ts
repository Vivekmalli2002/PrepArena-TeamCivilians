import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import map from "../data/subject-topics.json";

const rows = Object.values(map as unknown as Record<string, [string, number | null]>);
const count = new Map<string, number>();
for (const [name] of rows) count.set(name, (count.get(name) ?? 0) + 1);
const names = [...count.keys()].join("\n").toLowerCase();

describe("catch-all general-studies topics are grouped into syllabus chapters", () => {
  it("splits Polity into the chapters a learner looks for", () => {
    for (const w of ["fundamental rights", "panchayati raj", "president", "emergency provisions", "constitutional amendments", "judiciary", "parliament"]) expect(names, w).toContain(w);
  });
  it("splits AP history, society, reasoning, current affairs and economy", () => {
    for (const w of ["kakatiyas", "vijayanagara", "andhra movement", "caste system", "blood relations", "seating arrangement", "awards", "sports", "public finance", "demographics"]) expect(names, w).toContain(w);
  });
  it("leaves no catch-all chapter bigger than 200 questions and few in 'other' buckets", () => {
    for (const [n, c] of count) if (!/other questions$/.test(n)) expect(c, n).toBeLessThan(200);
    const other = [...count].filter(([n]) => /other questions$/.test(n)).reduce((a, [, c]) => a + c, 0);
    expect(other / rows.length).toBeLessThan(0.2);
  });
  it("no longer publishes the old catch-all topics", () => {
    const index = JSON.parse(readFileSync("public/data/index.json", "utf8"));
    const topics = new Set(index.topics.map((t: { subject: string; name: string }) => `${t.subject}/${t.name}`));
    for (const old of ["polity/Indian polity & constitution", "history/AP social & cultural history", "economy/Indian economy", "geography/Geography", "scitech/Science & technology", "current/Current affairs & general studies"])
      expect(topics.has(old), old).toBe(false);
  });
});
