import { describe, expect, it } from "vitest";
import { makeBackup, parseBackup } from "@/lib/backup";
import { EXAMS } from "@/content/catalog";
import { examChecklist, examsListing, paperKeys, progressOf, uniqueKeys, unitKey } from "@/lib/syllabus";

const find = (examId: string, subjectId: string, titlePart: string) =>
  examChecklist(examId as never).flatMap((p) => p.subjects.filter((s) => s.id === subjectId).flatMap((s) => s.units)).find((u) => u.title.includes(titlePart));

describe("syllabus checklist per exam", () => {
  it("lists paper → subject → unit for every exam, only the units the exam lists, and no practice buckets", () => {
    for (const e of EXAMS) {
      const papers = examChecklist(e.id);
      expect(papers.length, e.id).toBeGreaterThan(0);
      for (const s of papers.flatMap((p) => p.subjects)) {
        expect(["numericals", "civil-other", "engg-core"]).not.toContain(s.id);
        expect(s.units.length).toBeGreaterThan(0);
      }
    }
    const rbi = examChecklist("aee-rbi");
    expect(rbi.map((p) => p.id)).toEqual(["gs-common", "aee-common-2", "aee-rbi-3"]);
    expect(rbi[0].subjects.find((s) => s.id === "env")!.units.map((u) => u.no)).toEqual([1, 4, 5, 8, 10]);
  });
  it("gives the same unit the same key in every exam, so progress is shared", () => {
    // Disaster Management: common GS paper (all AEE exams) and AEE PR & TW Paper-3
    const gs = find("aee-pcb", "env", "Disaster")!;
    const prtw3 = examChecklist("aee-prtw").find((p) => p.id === "aee-prtw-3")!.subjects.find((s) => s.id === "env")!.units.find((u) => u.title.includes("Disaster"))!;
    expect(gs.key).toBe(unitKey("env", 10));
    expect(prtw3.key).toBe(gs.key);
    // AP history shared by ASWO and Group-2
    for (const t of ["AP: prehistoric", "AP: medieval", "AP: Europeans", "AP: Andhra movement", "AP: formation"]) expect(find("aswo", "history", t)!.key).toBe(find("group2", "history", t)!.key);
    expect(find("aswo", "history", "AP: prehistoric")!.alsoIn).toContain("Group-2");
    expect(find("group2", "history", "AP: prehistoric")!.alsoIn).toContain("ASWO / ATWO");
  });
  it("one tick shows as done in every exam that lists the unit, and counts once per exam", () => {
    const key = unitKey("env", 10);
    const syll = { [key]: 1 };
    const exams = examsListing(key);
    expect(exams).toEqual(expect.arrayContaining(["aee-pcb", "aee-prtw", "aee-rbi", "aswo", "eo", "draughtsman"]));
    for (const id of exams) expect(progressOf(uniqueKeys(examChecklist(id)), syll).done, id).toBe(1);
    // a unit listed by two papers of one exam is counted once
    const prtw = examChecklist("aee-prtw");
    const listed = prtw.flatMap((p) => paperKeys(p));
    expect(listed.length).toBeGreaterThan(uniqueKeys(prtw).length);
    expect(progressOf(listed, syll)).toEqual({ done: 1, total: uniqueKeys(prtw).length });
    // an exam that does not list the unit is untouched
    expect(progressOf(uniqueKeys(examChecklist("group2")), syll).done).toBe(0);
  });
  it("is part of the backup and survives a round trip", () => {
    const syll = { "history:3": 111, "env:10": 222 };
    const text = JSON.stringify(makeBackup({ profile: null, theme: "system", attempts: [], qstats: {}, bookmarks: [], activeDays: [], syll }));
    expect(parseBackup(text).syll).toEqual(syll);
    expect(parseBackup(JSON.stringify(makeBackup({ profile: null, theme: "system", attempts: [], qstats: {}, bookmarks: [], activeDays: [] }))).syll).toEqual({});
  });
});
