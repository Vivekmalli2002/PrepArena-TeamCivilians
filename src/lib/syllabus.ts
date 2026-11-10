/**
 * Syllabus checklist per exam: Paper → subject → unit. A unit is identified by its subject and number (`history:3`), not by the
 * exam, so ticking it in one exam shows it as done in every other exam whose syllabus lists the same unit (Disaster Management in
 * the common GS paper and in AEE PR & TW Paper-3, AP History in ASWO and Group-2 Mains, …). Progress is stored once, in `syll`.
 */
import { EXAMS, PAPERS, SUBJECTS, examById, type ExamId } from "@/content/catalog";

/** Catalog subjects that are practice buckets, not syllabus lines. */
const NOT_SYLLABUS = new Set(["numericals", "civil-other", "engg-core"]);

export const unitKey = (subjectId: string, unitNo: number) => `${subjectId}:${unitNo}`;

export interface ChecklistUnit {
  key: string;
  no: number;
  title: string;
  /** Short names of the other exams that list this same unit. */
  alsoIn: string[];
}
export interface ChecklistSubject {
  id: string;
  name: string;
  units: ChecklistUnit[];
}
export interface ChecklistPaper {
  id: string;
  name: string;
  marks?: number;
  subjects: ChecklistSubject[];
}

export function examChecklist(examId: ExamId): ChecklistPaper[] {
  const exam = examById(examId);
  if (!exam) return [];
  const short = new Map(EXAMS.map((e) => [e.id, e.short]));
  return exam.papers
    .map((pid) => PAPERS[pid])
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      marks: p.marks,
      subjects: p.subjects
        .filter((sid) => SUBJECTS[sid] && !NOT_SYLLABUS.has(sid))
        .map((sid) => {
          const s = SUBJECTS[sid];
          const units = s.units
            .map((u, i) => ({ u, no: i + 1 }))
            .filter(({ u }) => u.exams.includes(examId))
            .map(({ u, no }) => ({
              key: unitKey(sid, no),
              no,
              title: u.title,
              alsoIn: u.exams.filter((e) => e !== examId).map((e) => short.get(e) ?? e),
            }));
          return { id: sid, name: s.name, units };
        })
        .filter((s) => s.units.length > 0),
    }))
    .filter((p) => p.subjects.length > 0);
}

/** Every distinct unit of the exam (a unit that appears in two papers counts once). */
export const uniqueKeys = (papers: ChecklistPaper[]): string[] => [...new Set(papers.flatMap((p) => p.subjects.flatMap((s) => s.units.map((u) => u.key))))];

export interface Progress {
  done: number;
  total: number;
}
export const progressOf = (keys: string[], syll: Record<string, number>): Progress => {
  const ks = [...new Set(keys)];
  return { done: ks.filter((k) => syll[k]).length, total: ks.length };
};
export const subjectKeys = (s: ChecklistSubject) => s.units.map((u) => u.key);
export const paperKeys = (p: ChecklistPaper) => p.subjects.flatMap(subjectKeys);

/** Exams that list the unit (for the "done in" note after ticking). */
export function examsListing(key: string): ExamId[] {
  return EXAMS.filter((e) => uniqueKeys(examChecklist(e.id)).includes(key)).map((e) => e.id);
}
