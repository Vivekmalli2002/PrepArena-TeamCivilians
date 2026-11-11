/**
 * Subjects checklist per exam: Paper → subject. A subject is identified by its id (`history`, `env`, `civil-fm`), not by the exam, so
 * ticking it in one exam shows it as done in every other exam whose papers carry the same subject (Environmental Science in the common GS
 * paper and in AEE PR & TW Paper-3, AP & Indian History in ASWO and Group-2, …). Progress is stored once, in `syll`.
 */
import { EXAMS, PAPERS, SUBJECTS, examById, type ExamId } from "@/content/catalog";

/** Catalog subjects that are practice buckets, not syllabus subjects. */
const NOT_SYLLABUS = new Set(["numericals", "civil-other", "engg-core"]);

export interface ChecklistSubject {
  /** Subject id; also the key under which the tick is stored. */
  key: string;
  name: string;
  /** Short names of the other exams that carry this subject. */
  alsoIn: string[];
}
export interface ChecklistPaper {
  id: string;
  name: string;
  marks?: number;
  subjects: ChecklistSubject[];
}

/** Subjects an exam really studies: the paper lists it and at least one of its units belongs to the exam. */
const subjectIds = (examId: ExamId): Set<string> => {
  const exam = examById(examId);
  const out = new Set<string>();
  for (const pid of exam?.papers ?? []) {
    for (const sid of PAPERS[pid]?.subjects ?? []) {
      const s = SUBJECTS[sid];
      if (s && !NOT_SYLLABUS.has(sid) && s.units.some((u) => u.exams.includes(examId))) out.add(sid);
    }
  }
  return out;
};

export function examChecklist(examId: ExamId): ChecklistPaper[] {
  const exam = examById(examId);
  if (!exam) return [];
  const short = new Map(EXAMS.map((e) => [e.id, e.short]));
  const others = EXAMS.filter((e) => e.id !== examId).map((e) => ({ id: e.id, subjects: subjectIds(e.id) }));
  const mine = subjectIds(examId);
  return exam.papers
    .map((pid) => PAPERS[pid])
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      marks: p.marks,
      subjects: p.subjects
        .filter((sid) => mine.has(sid))
        .map((sid) => ({
          key: sid,
          name: SUBJECTS[sid].name,
          alsoIn: others.filter((o) => o.subjects.has(sid)).map((o) => short.get(o.id) ?? o.id),
        })),
    }))
    .filter((p) => p.subjects.length > 0);
}

/** Every distinct subject of the exam (a subject that appears in two papers counts once). */
export const uniqueKeys = (papers: ChecklistPaper[]): string[] => [...new Set(papers.flatMap((p) => p.subjects.map((s) => s.key)))];

export interface Progress {
  done: number;
  total: number;
}
export const progressOf = (keys: string[], syll: Record<string, number>): Progress => {
  const ks = [...new Set(keys)];
  return { done: ks.filter((k) => syll[k]).length, total: ks.length };
};
export const paperKeys = (p: ChecklistPaper) => p.subjects.map((s) => s.key);

/** Exams that carry the subject (for the "done in" note after ticking). */
export const examsListing = (key: string): ExamId[] => EXAMS.filter((e) => subjectIds(e.id).has(key)).map((e) => e.id);
