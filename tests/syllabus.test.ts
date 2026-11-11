import { describe, expect, it } from "vitest";
import { makeBackup, parseBackup } from "@/lib/backup";
import { EXAMS } from "@/content/catalog";
import { examChecklist, examsListing, paperKeys, progressOf, uniqueKeys } from "@/lib/syllabus";

const find = (examId: string, key: string) => examChecklist(examId as never).flatMap((p) => p.subjects).find((s) => s.key === key);

describe("subjects checklist per exam", () => {
  it("lists paper → subject for every exam, without units and without practice buckets", () => {
    for (const e of EXAMS) {
      const papers = examChecklist(e.id);
      expect(papers.length, e.id).toBeGreaterThan(0);
      for (const s of papers.flatMap((p) => p.subjects)) {
        expect(["numericals", "civil-other", "engg-core"]).not.toContain(s.key);
        expect(s.name.length).toBeGreaterThan(2);
        expect(Object.keys(s).sort()).toEqual(["alsoIn", "key", "name"]);
      }
    }
    const rbi = examChecklist("aee-rbi");
    expect(rbi.map((p) => p.id)).toEqual(["gs-common", "aee-common-2", "aee-rbi-3"]);
    expect(rbi[0].subjects.map((s) => s.key)).toEqual(["current", "scitech", "history", "geography", "polity", "economy", "env", "mental"]);
    expect(rbi[1].subjects.map((s) => s.name)).toEqual(["Engineering Mechanics", "Strength of Materials", "Fluid Mechanics", "Hydraulic Machines"]);
  });
  it("gives the same subject the same key in every exam, so progress is shared", () => {
    expect(find("aswo", "history")!.key).toBe(find("group2", "history")!.key);
    expect(find("aswo", "history")!.alsoIn).toContain("Group-2");
    expect(find("group2", "history")!.alsoIn).toContain("ASWO / ATWO");
    // Environmental Science: common GS paper and AEE PR & TW Paper-3 (same subject, same tick)
    const prtw = examChecklist("aee-prtw");
    const envPapers = prtw.filter((p) => p.subjects.some((s) => s.key === "env")).map((p) => p.id);
    expect(envPapers).toEqual(["gs-common", "aee-prtw-3"]);
  });
  it("one tick shows as done in every exam that carries the subject, and counts once per exam", () => {
    const syll = { env: 1 };
    const exams = examsListing("env");
    expect(exams).toEqual(expect.arrayContaining(["aee-pcb", "aee-prtw", "aee-rbi", "aswo", "eo", "draughtsman"]));
    for (const id of exams) expect(progressOf(uniqueKeys(examChecklist(id)), syll).done, id).toBe(1);
    const prtw = examChecklist("aee-prtw");
    const listed = prtw.flatMap((p) => paperKeys(p));
    expect(listed.length).toBeGreaterThan(uniqueKeys(prtw).length);
    expect(progressOf(listed, syll)).toEqual({ done: 1, total: uniqueKeys(prtw).length });
    expect(examsListing("civil-geo")).not.toContain("group2");
    expect(progressOf(uniqueKeys(examChecklist("group2")), { "civil-geo": 1 }).done).toBe(0);
  });
  it("is part of the backup and survives a round trip", () => {
    const syll = { history: 111, env: 222 };
    const text = JSON.stringify(makeBackup({ profile: null, theme: "system", attempts: [], qstats: {}, bookmarks: [], activeDays: [], syll }));
    expect(parseBackup(text).syll).toEqual(syll);
  });
});
