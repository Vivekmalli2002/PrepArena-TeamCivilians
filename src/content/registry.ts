/**
 * Examination pattern registry with provenance. Patterns themselves live in notifications.ts (transcribed from
 * docs/notifications/); this file records WHERE each scheme is printed and how far it has been checked, so the app
 * never presents an unverified pattern as official. Anything not listed here is "awaiting verification".
 */
import { EXAMS, PAPERS, SUBJECTS, examsSharingPaper, type ExamId } from "./catalog";
import { NOTIFICATIONS, notificationFor, type Stage } from "./notifications";

export type Verification = "verified" | "brief-only";

export interface SchemeSource {
  doc: string;
  /** 1-based PDF page of docs/notifications/<doc> where the scheme table is printed. */
  page: number;
  /** G.O. cited by the notification for the scheme. */
  authority: string;
  checkedOn: string;
  status: Verification;
  note?: string;
}

const CHECKED = "2026-10-31";

/** Pages were read against the PDFs on `checkedOn`; the stage tables in notifications.ts are the transcription. */
export const SCHEME_SOURCES: Record<ExamId, SchemeSource> = {
  group1: { doc: "Group-I_Final_06102026.pdf", page: 26, authority: "G.O.Ms.No.158, GA (Ser-A), 26-12-2018", checkedOn: CHECKED, status: "verified", note: "Screening scheme p.26; Mains scheme p.26–27; syllabus from p.27." },
  group2: { doc: "Group_-_II_Brief_Notification.pdf", page: 5, authority: "G.O.Ms.No.06, Finance (HR-I), 06-01-2023", checkedOn: CHECKED, status: "brief-only", note: "The 2026 brief notification annexes the 2023 scheme unchanged (150 Q / 150 min / 150 marks screening; two 150-Q Mains papers). The detailed notification (due by 10/11/2026) is the final authority — re-check when published." },
  "aee-pcb": { doc: "Assistan_Environmental_Engineer_08-2026.pdf", page: 14, authority: "Annexure-V, G.O.Ms.No.201, Finance (HR-I), 21-12-2017", checkedOn: CHECKED, status: "verified" },
  "aee-prtw": { doc: "Revised_AEE_1.pdf", page: 5, authority: "Annexure-VII, G.O.Ms.No.201, Finance (HR-I), 21-12-2017", checkedOn: CHECKED, status: "brief-only", note: "Brief Notification 27/2026; detailed notification due." },
  "aee-rbi": { doc: "Revised_AEE_1.pdf", page: 5, authority: "Annexure-VII, G.O.Ms.No.201, Finance (HR-I), 21-12-2017", checkedOn: CHECKED, status: "brief-only", note: "Brief Notification 27/2026; detailed notification due." },
  aswo: { doc: "ASWO__ATWO_2026.pdf", page: 16, authority: "Annexure-III, G.O.Ms.No.141, 01-08-2016 r/w G.O.Ms.No.100 GA, 30-09-2022", checkedOn: CHECKED, status: "verified" },
  eo: { doc: "EO_Grade-III_Detailed_Notification.pdf", page: 16, authority: "Annexure-V, G.O.Ms.No.201, Finance (HR-I), 21-12-2017", checkedOn: CHECKED, status: "verified" },
  draughtsman: { doc: "Draughtsman_Detailed_Notification.pdf", page: 15, authority: "Annexure-V, G.O.Ms.No.201, Finance (HR-I), 21-12-2017", checkedOn: CHECKED, status: "verified" },
};

export const VERIFICATION_LABEL: Record<Verification, string> = {
  verified: "Verified against detailed notification",
  "brief-only": "Brief notification only — detailed notification awaited",
};

export interface PatternRow {
  examId: ExamId;
  stage: Stage;
  source: SchemeSource;
}

export function patternRows(): PatternRow[] {
  return NOTIFICATIONS.flatMap((n) => n.stages.map((stage) => ({ examId: n.examId, stage, source: SCHEME_SOURCES[n.examId] })));
}

export interface CommonSubject {
  subjectId: string;
  name: string;
  exams: ExamId[];
  /** Papers (by exam) that carry the subject — the evidence for the classification. */
  via: { examId: ExamId; paperId: string }[];
}

/** Subjects that appear in the papers of two or more exams. Presence in a paper, not depth of coverage. */
export function commonSubjects(selected: ExamId[] = EXAMS.map((e) => e.id)): CommonSubject[] {
  const out: CommonSubject[] = [];
  for (const [subjectId, subject] of Object.entries(SUBJECTS)) {
    const via: CommonSubject["via"] = [];
    for (const examId of selected) {
      const exam = EXAMS.find((e) => e.id === examId)!;
      for (const paperId of exam.papers) if (PAPERS[paperId]?.subjects.includes(subjectId)) via.push({ examId, paperId });
    }
    const exams = [...new Set(via.map((v) => v.examId))];
    if (exams.length >= 1) out.push({ subjectId, name: subject.name, exams, via });
  }
  return out.sort((a, b) => b.exams.length - a.exams.length);
}

/** Papers literally shared between exams (same paper id), e.g. GS Paper-I and AEE Paper-II. */
export function sharedPapers() {
  return Object.values(PAPERS)
    .map((p) => ({ paper: p, exams: examsSharingPaper(p.id) }))
    .filter((x) => x.exams.length >= 2);
}

export { notificationFor };

/* ---------------- syllabus overlap (unit level) ---------------- */

export type OverlapClass = "common-all" | "shared-some" | "unique";

export interface UnitOverlap {
  subjectId: string;
  subject: string;
  unit: string;
  /** Exams (among ALL exams) whose syllabus lists the unit. */
  listedIn: ExamId[];
  /** Subset of the selected exams that list it. */
  selectedListed: ExamId[];
  cls: OverlapClass;
}

/**
 * Classifies every syllabus unit against a selection of exams.
 * Evidence: catalog.ts, transcribed from the YUDDAM 2027 overlap masters (docs/syllabus/) and the notifications.
 * "Listed in" means the unit appears in a paper of the exam; whether the depth is identical needs editorial review.
 */
export function unitOverlap(selected: ExamId[]): UnitOverlap[] {
  const sel = new Set(selected);
  const out: UnitOverlap[] = [];
  for (const s of Object.values(SUBJECTS)) {
    for (const u of s.units) {
      const selectedListed = u.exams.filter((e) => sel.has(e));
      if (!selectedListed.length) continue;
      out.push({
        subjectId: s.id,
        subject: s.name,
        unit: u.title,
        listedIn: u.exams,
        selectedListed,
        cls: selectedListed.length === sel.size ? "common-all" : selectedListed.length === 1 ? "unique" : "shared-some",
      });
    }
  }
  return out;
}

/** Units listed in exactly one exam of the whole catalogue — that exam's own preparation burden. */
export function uniqueUnits(examId: ExamId) {
  return Object.values(SUBJECTS).flatMap((s) =>
    s.units.filter((u) => u.exams.length === 1 && u.exams[0] === examId).map((u) => ({ subject: s.name, unit: u.title })),
  );
}

/** Papers used by exactly one exam (own syllabus text), with their official wording from the notification. */
export function ownPapers(examId: ExamId) {
  const exam = EXAMS.find((e) => e.id === examId)!;
  return exam.papers.map((id) => PAPERS[id]).filter((p) => p && examsSharingPaper(p.id, examId).length === 0);
}

export const STAGE_PAPERS: Partial<Record<ExamId, { first: { label: string; papers: string[] }; second: { label: string; papers: string[] } }>> = {
  group1: {
    first: { label: "Screening (Prelims)", papers: ["g1-prelims-1", "g1-prelims-2"] },
    second: { label: "Mains", papers: ["g1-mains-1", "g1-mains-2", "g1-mains-3", "g1-mains-4", "g1-mains-5"] },
  },
  group2: {
    first: { label: "Screening (Prelims)", papers: ["g2-screening"] },
    second: { label: "Mains", papers: ["g2-mains-1", "g2-mains-2"] },
  },
};

/** Which subjects appear in both stages, only in the first, or only in the second. */
export function stageComparison(examId: ExamId) {
  const st = STAGE_PAPERS[examId];
  if (!st) return null;
  const subj = (ids: string[]) => new Set(ids.flatMap((id) => PAPERS[id]?.subjects ?? []));
  const a = subj(st.first.papers);
  const b = subj(st.second.papers);
  const name = (id: string) => SUBJECTS[id]?.name ?? id;
  return {
    firstLabel: st.first.label,
    secondLabel: st.second.label,
    both: [...a].filter((x) => b.has(x)).map(name),
    onlyFirst: [...a].filter((x) => !b.has(x)).map(name),
    onlySecond: [...b].filter((x) => !a.has(x)).map(name),
  };
}
